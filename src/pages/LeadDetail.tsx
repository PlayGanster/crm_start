import { useState, useEffect } from 'react';
import { getLead, getStages, getServices, getLeadHistory, updateLead, deleteLead, Stage, Service } from '../db/database';

interface LeadDetailProps {
  leadId: number;
  navigate: (page: string, leadId?: number) => void;
}

export default function LeadDetail({ leadId, navigate }: LeadDetailProps) {
  const [lead, setLead] = useState<any>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [stageId, setStageId] = useState<number>(1);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const refresh = () => {
    const l = getLead(leadId);
    if (!l) {
      navigate('leads');
      return;
    }
    setLead(l);
    setName(l.name || '');
    setPhone(l.phone || '');
    setTelegram(l.telegram || '');
    setStageId(l.stage_id || 1);
    setServiceId(l.service_id);
    setAmount(l.amount || 0);
    setNotes(l.notes || '');
    setStages(getStages());
    setServices(getServices());
    setHistory(getLeadHistory(leadId));
  };

  useEffect(() => { refresh(); }, [leadId]);

  const handleSave = () => {
    updateLead(leadId, { name, phone, telegram, stage_id: stageId, service_id: serviceId, amount, notes });
    setEditing(false);
    refresh();
  };

  const handleDelete = () => {
    if (confirm('Удалить этого лида?')) {
      deleteLead(leadId);
      navigate('leads');
    }
  };

  const handleStageChange = (newStageId: number) => {
    setStageId(newStageId);
    updateLead(leadId, { ...lead, name, phone, telegram, stage_id: newStageId, service_id: serviceId, amount, notes });
    refresh();
  };

  if (!lead) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('leads')}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Назад
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Info */}
        <div className="col-span-2 space-y-4">
          {/* Card: Main info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                  {lead.name || 'Без имени'}
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Добавлен {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="flex gap-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors"
                  >
                    Редактировать
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => { setEditing(false); refresh(); }}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-md transition-colors"
                    >
                      Отмена
                    </button>
                  </>
                )}
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-zinc-700 rounded-md hover:border-red-800 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>

            {!editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Телефон</p>
                  <p className="text-sm text-zinc-300 mt-0.5">{lead.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Telegram</p>
                  <p className="text-sm text-zinc-300 mt-0.5">
                    {lead.telegram ? <a href={`https://t.me/${lead.telegram}`} target="_blank" className="text-indigo-400 hover:text-indigo-300">@{lead.telegram}</a> : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Услуга</p>
                  <p className="text-sm text-zinc-300 mt-0.5">{lead.service_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Сумма</p>
                  <p className="text-sm text-zinc-300 mt-0.5">{lead.amount ? `${lead.amount.toLocaleString()} ₽` : '—'}</p>
                </div>
                {lead.notes && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Заметки</p>
                    <p className="text-sm text-zinc-300 mt-0.5 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Телефон</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Telegram</label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={e => setTelegram(e.target.value.replace('@', ''))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Сумма (₽)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Заметки</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pipeline / Stage progression */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Этап воронки</h3>
            <div className="flex gap-1">
              {stages.map((stage, idx) => (
                <button
                  key={stage.id}
                  onClick={() => !editing && handleStageChange(stage.id)}
                  disabled={editing}
                  className={`flex-1 py-2 px-2 rounded-md text-[11px] font-medium transition-all ${
                    stage.id === stageId
                      ? 'border-2 border-current'
                      : 'border-2 border-transparent opacity-40 hover:opacity-70'
                  }`}
                  style={{
                    backgroundColor: stage.color + '20',
                    color: stage.color,
                  }}
                >
                  {stage.name}
                </button>
              ))}
            </div>
            {!editing && (
              <div className="flex gap-1.5 mt-3">
                {stages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageChange(stage.id)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                      stage.id === stageId
                        ? 'border-zinc-600 text-zinc-200 bg-zinc-800'
                        : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    → {stage.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - History */}
        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">История</h3>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-600">Нет записей</p>
            ) : (
              <div className="space-y-3">
                {history.map((h: any) => (
                  <div key={h.id} className="border-l-2 border-zinc-800 pl-3 py-1">
                    <p className="text-xs text-zinc-300">{h.action}</p>
                    {h.from_stage_name && h.to_stage_name && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {h.from_stage_name} → {h.to_stage_name}
                      </p>
                    )}
                    {h.note && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">{h.note}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {new Date(h.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Быстрые действия</h3>
            <div className="space-y-2">
              {lead.telegram && (
                <a
                  href={`https://t.me/${lead.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 hover:border-zinc-600 transition-colors"
                >
                  Открыть в Telegram →
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="block w-full text-left px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 hover:border-zinc-600 transition-colors"
                >
                  Позвонить →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
