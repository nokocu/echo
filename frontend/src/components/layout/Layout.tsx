import Header from './Header';
import Sidebar from './Sidebar';
import Spacer from './Spacer';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="antialiased dark:bg-gray-950 system">
      <Header/>
      <div className="grid min-h-dvh grid-rows-[1fr_1px_auto_1px_auto] grid-cols-[4rem_2.5rem_minmax(0,1fr)_2.5rem] xl:grid-cols-[12rem_2.5rem_minmax(0,1fr)_2.5rem]">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        <Spacer />
        <main className="relative row-start-1 grid grid-cols-subgrid lg:col-start-3">
          <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-5xl">
            <div className="px-4 sm:px-6">
              {children}
            </div>
          </div>
        </main>
        <Spacer />
      </div>
    </div>
  );
}
