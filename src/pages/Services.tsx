import { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService, Service } from '../db/database';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const refresh = () => setServices(getServices());
  useEffect(() => { refresh(); }, []);

  const handleCreate = () => {
    if (!formName.trim()) return;
    createService(formName.trim(), formDesc.trim());
    setFormName('');
    setFormDesc('');
    setShowForm(false);
    refresh();
  };

  const handleUpdate = (id: number) => {
    if (!formName.trim()) return;
    updateService(id, formName.trim(), formDesc.trim());
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    refresh();
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setFormName(s.name);
    setFormDesc(s.description || '');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Услуги</h1>
          <p className="text-sm text-zinc-500 mt-1">Управление списком услуг</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormName(''); setFormDesc(''); }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors"
        >
          + Добавить
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Название</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Например: Разработка Telegram бота"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Описание</label>
              <input
                type="text"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Краткое описание (необязательно)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
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

      {/* List */}
      <div className="space-y-2">
        {services.map(s => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
            {editingId === s.id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Описание"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
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
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{s.name}</p>
                  {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить услугу?')) { deleteService(s.id); refresh(); } }}
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

      {services.length === 0 && !showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-500 text-sm">Нет услуг</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Добавить первую услугу →
          </button>
        </div>
      )}
    </div>
  );
}
