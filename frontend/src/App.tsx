import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import KanbanBoard from './components/tasks/KanbanBoard';
import ProjectsManager from './components/projects/ProjectsManager';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const handleViewProjectTasks = (projectId: number) => {
    setSelectedProjectId(projectId);
    setActiveTab('tasks');
  };

  const handleAuthSuccess = () => {
    window.location.reload(); // simple way to refresh the app state
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <KanbanBoard initialProjectId={selectedProjectId} />;
      case 'projects':
        return <ProjectsManager onViewTasks={handleViewProjectTasks} />;
      case 'workflow':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Workflow Designer</h2>
            <p className="text-gray-400">bpmn workflow designer</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm 
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm 
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
