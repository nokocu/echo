import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header title="echo" subtitle="task management system" />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <main className="flex-1 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
