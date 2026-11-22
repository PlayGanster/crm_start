import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  page: string;
  navigate: (page: string) => void;
}

export default function Layout({ children, page, navigate }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: '◫' },
    { id: 'leads', label: 'Лиды', icon: '◎' },
    { id: 'services', label: 'Услуги', icon: '▣' },
    { id: 'stages', label: 'Воронка', icon: '▽' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">CRM</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Управление лидами</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2.5 transition-colors ${
                page === item.id || (page === 'lead-detail' && item.id === 'leads')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600">SQLite • Локально</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
