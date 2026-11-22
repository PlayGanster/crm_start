// @ts-ignore
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
const DB_KEY = 'crm_leads_db';

export async function initDB(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  const savedDb = localStorage.getItem(DB_KEY);
  if (savedDb) {
    const binary = atob(savedDb);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      telegram TEXT DEFAULT '',
      stage_id INTEGER,
      service_id INTEGER,
      amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      from_stage_id INTEGER,
      to_stage_id INTEGER,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (from_stage_id) REFERENCES stages(id),
      FOREIGN KEY (to_stage_id) REFERENCES stages(id)
    );
  `);

  // Seed default stages if empty
  const stageCount = db.exec("SELECT COUNT(*) FROM stages");
  if (stageCount[0]?.values[0][0] === 0) {
    const defaultStages = [
      { name: 'Новый лид', color: '#6366f1', order: 1 },
      { name: 'Контакт установлен', color: '#3b82f6', order: 2 },
      { name: 'Предложение отправлено', color: '#f59e0b', order: 3 },
      { name: 'Переговоры', color: '#f97316', order: 4 },
      { name: 'Согласился', color: '#10b981', order: 5 },
      { name: 'Отказ', color: '#ef4444', order: 6 },
    ];
    defaultStages.forEach(s => {
      db!.run("INSERT INTO stages (name, color, sort_order) VALUES (?, ?, ?)", [s.name, s.color, s.order]);
    });
  }

  // Seed default services if empty
  const serviceCount = db.exec("SELECT COUNT(*) FROM services");
  if (serviceCount[0]?.values[0][0] === 0) {
    const defaultServices = [
      { name: 'Разработка Telegram бота', description: '' },
      { name: 'Разработка веб-приложения', description: '' },
      { name: 'Парсинг данных', description: '' },
      { name: 'Автоматизация', description: '' },
    ];
    defaultServices.forEach(s => {
      db!.run("INSERT INTO services (name, description) VALUES (?, ?)", [s.name, s.description]);
    });
  }

  saveDB();
  return db;
}

export function saveDB() {
  if (!db) return;
  const data = db.export();
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  localStorage.setItem(DB_KEY, btoa(binary));
}

export function getDB(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// Leads CRUD
export interface Lead {
  id: number;
  name: string;
  phone: string;
  telegram: string;
  stage_id: number | null;
  service_id: number | null;
  amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  stage_name?: string;
  stage_color?: string;
  service_name?: string;
}

export function getLeads(filter?: { stage_id?: number; search?: string }): Lead[] {
  const d = getDB();
  let query = `
    SELECT l.*, s.name as stage_name, s.color as stage_color, sv.name as service_name
    FROM leads l
    LEFT JOIN stages s ON l.stage_id = s.id
    LEFT JOIN services sv ON l.service_id = sv.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filter?.stage_id) {
    query += ' AND l.stage_id = ?';
    params.push(filter.stage_id);
  }
  if (filter?.search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.telegram LIKE ?)';
    const s = `%${filter.search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY l.updated_at DESC';

  const result = d.exec(query, params);
  if (!result[0]) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const lead: any = {};
    columns.forEach((col, i) => {
      lead[col] = row[i];
    });
    return lead as Lead;
  });
}

export function getLead(id: number): Lead | null {
  const d = getDB();
  const result = d.exec(`
    SELECT l.*, s.name as stage_name, s.color as stage_color, sv.name as service_name
    FROM leads l
    LEFT JOIN stages s ON l.stage_id = s.id
    LEFT JOIN services sv ON l.service_id = sv.id
    WHERE l.id = ?
  `, [id]);

  if (!result[0] || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const lead: any = {};
  columns.forEach((col, i) => {
    lead[col] = result[0].values[0][i];
  });
  return lead as Lead;
}

export function createLead(data: Partial<Lead>): number {
  const d = getDB();
  d.run(`
    INSERT INTO leads (name, phone, telegram, stage_id, service_id, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [data.name || '', data.phone || '', data.telegram || '', data.stage_id || 1, data.service_id || null, data.amount || 0, data.notes || '']);

  const result = d.exec("SELECT last_insert_rowid()");
  const id = result[0].values[0][0] as number;

  // Add history entry
  d.run(`
    INSERT INTO lead_history (lead_id, action, to_stage_id, note)
    VALUES (?, 'Создан лид', ?, ?)
  `, [id, data.stage_id || 1, data.notes || '']);

  saveDB();
  return id;
}

export function updateLead(id: number, data: Partial<Lead>) {
  const d = getDB();
  const oldLead = getLead(id);

  d.run(`
    UPDATE leads SET name=?, phone=?, telegram=?, stage_id=?, service_id=?, amount=?, notes=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `, [data.name, data.phone, data.telegram, data.stage_id, data.service_id, data.amount, data.notes, id]);

  // If stage changed, add history
  if (oldLead && oldLead.stage_id !== data.stage_id) {
    d.run(`
      INSERT INTO lead_history (lead_id, action, from_stage_id, to_stage_id, note)
      VALUES (?, 'Этап изменён', ?, ?, ?)
    `, [id, oldLead.stage_id, data.stage_id, data.notes || '']);
  }

  saveDB();
}

export function deleteLead(id: number) {
  const d = getDB();
  d.run("DELETE FROM lead_history WHERE lead_id = ?", [id]);
  d.run("DELETE FROM leads WHERE id = ?", [id]);
  saveDB();
}

export function getLeadHistory(leadId: number) {
  const d = getDB();
  const result = d.exec(`
    SELECT h.*, s1.name as from_stage_name, s2.name as to_stage_name
    FROM lead_history h
    LEFT JOIN stages s1 ON h.from_stage_id = s1.id
    LEFT JOIN stages s2 ON h.to_stage_id = s2.id
    WHERE h.lead_id = ?
    ORDER BY h.created_at DESC
  `, [leadId]);

  if (!result[0]) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const item: any = {};
    columns.forEach((col, i) => { item[col] = row[i]; });
    return item;
  });
}

// Stages CRUD
export interface Stage {
  id: number;
  name: string;
  color: string;
  sort_order: number;
}

export function getStages(): Stage[] {
  const d = getDB();
  const result = d.exec("SELECT * FROM stages ORDER BY sort_order");
  if (!result[0]) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const stage: any = {};
    columns.forEach((col, i) => { stage[col] = row[i]; });
    return stage as Stage;
  });
}

export function createStage(name: string, color: string): number {
  const d = getDB();
  const maxOrder = d.exec("SELECT MAX(sort_order) FROM stages");
  const order = (maxOrder[0]?.values[0][0] || 0) + 1;
  d.run("INSERT INTO stages (name, color, sort_order) VALUES (?, ?, ?)", [name, color, order]);
  const result = d.exec("SELECT last_insert_rowid()");
  saveDB();
  return result[0].values[0][0] as number;
}

export function updateStage(id: number, name: string, color: string) {
  const d = getDB();
  d.run("UPDATE stages SET name=?, color=? WHERE id=?", [name, color, id]);
  saveDB();
}

export function deleteStage(id: number) {
  const d = getDB();
  d.run("UPDATE leads SET stage_id = NULL WHERE stage_id = ?", [id]);
  d.run("DELETE FROM stages WHERE id = ?", [id]);
  saveDB();
}

// Services CRUD
export interface Service {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export function getServices(): Service[] {
  const d = getDB();
  const result = d.exec("SELECT * FROM services ORDER BY name");
  if (!result[0]) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const service: any = {};
    columns.forEach((col, i) => { service[col] = row[i]; });
    return service as Service;
  });
}

export function createService(name: string, description: string): number {
  const d = getDB();
  d.run("INSERT INTO services (name, description) VALUES (?, ?)", [name, description]);
  const result = d.exec("SELECT last_insert_rowid()");
  saveDB();
  return result[0].values[0][0] as number;
}

export function updateService(id: number, name: string, description: string) {
  const d = getDB();
  d.run("UPDATE services SET name=?, description=? WHERE id=?", [name, description, id]);
  saveDB();
}

export function deleteService(id: number) {
  const d = getDB();
  d.run("UPDATE leads SET service_id = NULL WHERE service_id = ?", [id]);
  d.run("DELETE FROM services WHERE id = ?", [id]);
  saveDB();
}

// Stats
export function getStats() {
  const d = getDB();
  const total = d.exec("SELECT COUNT(*) FROM leads");
  const byStage = d.exec(`
    SELECT s.id, s.name, s.color, COUNT(l.id) as count
    FROM stages s
    LEFT JOIN leads l ON l.stage_id = s.id
    GROUP BY s.id
    ORDER BY s.sort_order
  `);
  const totalAmount = d.exec("SELECT COALESCE(SUM(amount), 0) FROM leads WHERE stage_id IN (SELECT id FROM stages WHERE name = 'Согласился')");

  return {
    total: total[0]?.values[0][0] || 0,
    byStage: byStage[0]?.values.map(row => ({
      id: row[0],
      name: row[1],
      color: row[2],
      count: row[3]
    })) || [],
    totalAmount: totalAmount[0]?.values[0][0] || 0,
  };
}
