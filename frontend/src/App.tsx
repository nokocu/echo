import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/DashPage';
import KanbanBoard from './components/tasks/KanbanPage';
import ProjectsManager from './components/projects/ProjectsPage';
import AllWorkflowsManager from './components/workflow/WorkflowPage';
import LoginForm from './components/auth/LoginPage';
import RegisterForm from './components/auth/RegisterPage';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  
  // Initialize activeTab from URL hash immediately
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['dashboard', 'tasks', 'projects', 'workflow'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Initialize selectedProjectId from localStorage immediately
  const getInitialProjectId = () => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    return savedProjectId ? parseInt(savedProjectId, 10) : null;
  };
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(getInitialProjectId);

  // Initialize state from URL and localStorage
  useEffect(() => {
    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'tasks', 'projects', 'workflow'];
      if (validTabs.includes(newHash)) {
        setActiveTab(newHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL when activeTab changes
  useEffect(() => {
    if (activeTab && window.location.hash !== `#${activeTab}`) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // Save selected project to localStorage
  useEffect(() => {
    if (selectedProjectId !== null) {
      localStorage.setItem('selectedProjectId', selectedProjectId.toString());
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProjectId]);

  const handleViewProjectTasks = (projectId: number) => {
    setSelectedProjectId(projectId);
    setActiveTab('tasks');
  };

  const handleProjectSelectionChange = (projectId: number | null) => {
    setSelectedProjectId(projectId);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `#${tab}`);
  };

  const handleAuthSuccess = () => {
    window.location.reload(); // simple way to refresh the app state
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <KanbanBoard initialProjectId={selectedProjectId} onProjectChange={handleProjectSelectionChange} />;
      case 'projects':
        return <ProjectsManager onViewTasks={handleViewProjectTasks} />;
      case 'workflow':
        return <AllWorkflowsManager />;
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
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
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
