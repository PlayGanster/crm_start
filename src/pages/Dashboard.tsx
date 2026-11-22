import { useState, useEffect } from 'react';
import { getStats, getLeads, getDB, saveDB } from '../db/database';

interface DashboardProps {
  navigate: (page: string, leadId?: number) => void;
}

export default function Dashboard({ navigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  useEffect(() => {
    setStats(getStats());
    setRecentLeads(getLeads().slice(0, 5));
  }, []);

  if (!stats) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-100">Дашборд</h1>
        <p className="text-sm text-zinc-500 mt-1">Обзор воронки и лидов</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Всего лидов</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Сумма сделок</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">
            {stats.totalAmount.toLocaleString()} ₽
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Этапов в воронке</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">{stats.byStage.length}</p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Воронка</h2>
        <div className="flex gap-1 items-end h-32">
          {stats.byStage.map((stage: any) => {
            const maxCount = Math.max(...stats.byStage.map((s: any) => s.count), 1);
            const height = Math.max((stage.count / maxCount) * 100, 8);
            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-zinc-400">{stage.count}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{ height: `${height}%`, backgroundColor: stage.color }}
                />
                <span className="text-[10px] text-zinc-500 text-center leading-tight mt-1 max-w-full truncate px-1">
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export/Import */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => {
            const db = getDB();
            const data = db.export();
            let binary = '';
            for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
            const blob = new Blob([btoa(binary)], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crm-backup-${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-md hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        >
          ↓ Экспорт БД
        </button>
        <label className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-md hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer">
          ↑ Импорт БД
          <input
            type="file"
            accept=".txt,.db,.sqlite"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!confirm('Это заменит текущую базу данных. Продолжить?')) return;
              const reader = new FileReader();
              reader.onload = () => {
                localStorage.setItem('crm_leads_db', reader.result as string);
                location.reload();
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-300">Последние лиды</h2>
          <button
            onClick={() => navigate('leads')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Все лиды →
          </button>
        </div>
        {recentLeads.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-sm text-zinc-500">Пока нет лидов</p>
            <button
              onClick={() => navigate('leads')}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Добавить первого лида →
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {recentLeads.map((lead: any) => (
              <button
                key={lead.id}
                onClick={() => navigate('lead-detail', lead.id)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3 hover:border-zinc-700 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: lead.stage_color || '#6366f1' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {lead.name || 'Без имени'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {lead.telegram || lead.phone || 'Нет контакта'}
                  </p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: (lead.stage_color || '#6366f1') + '20',
                    color: lead.stage_color || '#6366f1',
                  }}
                >
                  {lead.stage_name || '—'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
