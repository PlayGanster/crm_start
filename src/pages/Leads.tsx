import { useState, useEffect } from 'react';
import { getLeads, getStages, getServices, createLead, deleteLead, Lead, Stage, Service } from '../db/database';

interface LeadsProps {
  navigate: (page: string, leadId?: number) => void;
}

export default function Leads({ navigate }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const refresh = () => {
    setLeads(getLeads({ stage_id: filterStage || undefined, search: search || undefined }));
    setStages(getStages());
    setServices(getServices());
  };

  useEffect(() => { refresh(); }, [filterStage, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Лиды</h1>
          <p className="text-sm text-zinc-500 mt-1">{leads.length} записей</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs transition-colors ${view === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Список
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs transition-colors ${view === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Канбан
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors"
          >
            + Добавить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Поиск по имени, телефону, telegram..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <select
          value={filterStage || ''}
          onChange={e => setFilterStage(e.target.value ? Number(e.target.value) : null)}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
        >
          <option value="">Все этапы</option>
          {stages.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Views */}
      {view === 'list' ? (
        <LeadList leads={leads} navigate={navigate} refresh={refresh} />
      ) : (
        <KanbanView stages={stages} leads={leads} navigate={navigate} refresh={refresh} />
      )}

      {/* Add form modal */}
      {showForm && (
        <LeadForm
          stages={stages}
          services={services}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            createLead(data);
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function LeadList({ leads, navigate, refresh }: { leads: Lead[]; navigate: (p: string, id?: number) => void; refresh: () => void }) {
  if (leads.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
        <p className="text-zinc-500 text-sm">Нет лидов</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5">Имя</th>
            <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5">Контакт</th>
            <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5">Этап</th>
            <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5">Услуга</th>
            <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5">Сумма</th>
            <th className="text-right text-[11px] text-zinc-500 uppercase tracking-wider px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr
              key={lead.id}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
              onClick={() => navigate('lead-detail', lead.id)}
            >
              <td className="px-4 py-3">
                <span className="text-sm text-zinc-200">{lead.name || '—'}</span>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-zinc-400">
                  {lead.telegram && <div>@{lead.telegram}</div>}
                  {lead.phone && <div>{lead.phone}</div>}
                  {!lead.telegram && !lead.phone && <span className="text-zinc-600">—</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full inline-block"
                  style={{
                    backgroundColor: (lead.stage_color || '#6366f1') + '20',
                    color: lead.stage_color || '#6366f1',
                  }}
                >
                  {lead.stage_name || '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-zinc-400">{lead.service_name || '—'}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-zinc-300">
                  {lead.amount ? `${lead.amount.toLocaleString()} ₽` : '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Удалить лид?')) {
                      deleteLead(lead.id);
                      refresh();
                    }
                  }}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ stages, leads, navigate, refresh }: { stages: Stage[]; leads: Lead[]; navigate: (p: string, id?: number) => void; refresh: () => void }) {
  const allLeads = getLeads();

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map(stage => {
        const stageLeads = allLeads.filter(l => l.stage_id === stage.id);
        return (
          <div key={stage.id} className="min-w-[240px] flex-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-xs font-medium text-zinc-300">{stage.name}</span>
              <span className="text-[10px] text-zinc-600 ml-auto">{stageLeads.length}</span>
            </div>
            <div className="space-y-1.5">
              {stageLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => navigate('lead-detail', lead.id)}
                  className="bg-zinc-900 border border-zinc-800 rounded-md p-2.5 cursor-pointer hover:border-zinc-700 transition-colors"
                >
                  <p className="text-sm text-zinc-200 truncate">{lead.name || 'Без имени'}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    {lead.telegram ? `@${lead.telegram}` : lead.phone || 'Нет контакта'}
                  </p>
                  {lead.amount > 0 && (
                    <p className="text-[11px] text-emerald-400 mt-1">{lead.amount.toLocaleString()} ₽</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadForm({ stages, services, onClose, onSave }: {
  stages: Stage[];
  services: Service[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id || 1);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-medium text-zinc-100 mb-4">Новый лид</h2>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Имя или название"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Телефон</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Telegram</label>
              <input
                type="text"
                value={telegram}
                onChange={e => setTelegram(e.target.value.replace('@', ''))}
                placeholder="username"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Этап</label>
              <select
                value={stageId}
                onChange={e => setStageId(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Услуга</label>
              <select
                value={serviceId || ''}
                onChange={e => setServiceId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="">Не выбрана</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Заметки</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Первоначальные заметки..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave({ name, phone, telegram, stage_id: stageId, service_id: serviceId, notes })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
