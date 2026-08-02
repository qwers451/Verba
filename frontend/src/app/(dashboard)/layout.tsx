import Sidebar from '@/components/Sidebar';
import { AuthModal } from '@/components/AuthModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative w-full overflow-hidden">
      {/* Sidebar for Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 transition-all md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen w-full max-w-[100vw] overflow-x-hidden">
        {/* Mobile Header Toggle */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Кабинет студента</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">С возвращением! Здесь находится ваш учебный прогресс.</p>
          </div>
          <button className="md:hidden p-2 rounded-lg bg-surface-container text-primary">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {children}
      </main>
      <AuthModal />
    </div>
  );
}
