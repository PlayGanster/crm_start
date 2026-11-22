import { useState, useEffect } from 'react';
import { getStages, createStage, updateStage, deleteStage, Stage } from '../db/database';

const COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#64748b',
];

export default function Stages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);

  const refresh = () => setStages(getStages());
  useEffect(() => { refresh(); }, []);

  const handleCreate = () => {
    if (!formName.trim()) return;
    createStage(formName.trim(), formColor);
    setFormName('');
    setFormColor(COLORS[0]);
    setShowForm(false);
    refresh();
  };

  const handleUpdate = (id: number) => {
    if (!formName.trim()) return;
    updateStage(id, formName.trim(), formColor);
    setEditingId(null);
    refresh();
  };

  const startEdit = (s: Stage) => {
    setEditingId(s.id);
    setFormName(s.name);
    setFormColor(s.color);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Воронка</h1>
          <p className="text-sm text-zinc-500 mt-1">Настройка этапов воронки продаж</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormName(''); setFormColor(COLORS[0]); }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors"
        >
          + Добавить этап
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Название этапа</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Например: Договор"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Цвет</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-md transition-all ${formColor === c ? 'ring-2 ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors">
                Создать
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Предпросмотр воронки</p>
        <div className="flex gap-1">
          {stages.map((s, idx) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div
                className="flex-1 py-2 px-3 rounded-md text-center text-[11px] font-medium"
                style={{ backgroundColor: s.color + '25', color: s.color }}
              >
                {s.name}
              </div>
              {idx < stages.length - 1 && (
                <span className="text-zinc-700 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {stages.map(s => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
            {editingId === s.id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-6 h-6 rounded-md transition-all ${formColor === c ? 'ring-2 ring-offset-1 ring-offset-zinc-900 scale-110' : 'opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(s.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{s.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить этап? Лиды на этом этапе останутся без этапа.')) { deleteStage(s.id); refresh(); } }}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-md hover:border-red-900 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
