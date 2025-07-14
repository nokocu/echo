import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const handleAuthSuccess = () => {
    window.location.reload(); // simple way to refresh the app state
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
    <Layout>
      <Dashboard />
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
