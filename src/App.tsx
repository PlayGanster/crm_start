import { useState, useEffect } from 'react';
import { initDB } from './db/database';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Services from './pages/Services';
import Stages from './pages/Stages';

function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  useEffect(() => {
    initDB().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Загрузка базы данных...</div>
      </div>
    );
  }

  const navigate = (p: string, leadId?: number) => {
    setPage(p);
    if (leadId !== undefined) setSelectedLeadId(leadId);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'leads':
        return <Leads navigate={navigate} />;
      case 'lead-detail':
        return <LeadDetail leadId={selectedLeadId!} navigate={navigate} />;
      case 'services':
        return <Services />;
      case 'stages':
        return <Stages />;
      default:
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <Layout page={page} navigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
