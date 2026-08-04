import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { AuthModal } from '@/components/AuthModal';
import { AuthBootstrap } from '@/components/AuthBootstrap';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-screen relative w-full overflow-hidden">
      <AuthBootstrap />
      {/* Sidebar for Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 transition-all md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen w-full max-w-[100vw] overflow-x-hidden">
        <div className="md:hidden flex gap-2 overflow-x-auto pb-5 -mt-1 mb-3">
          <Link href="/dashboard" className="shrink-0 rounded-full bg-white px-3 py-2 text-on-surface font-label-sm shadow-sm border border-outline-variant/40">Главная</Link>
          <Link href="/materials" className="shrink-0 rounded-full bg-white px-3 py-2 text-on-surface font-label-sm shadow-sm border border-outline-variant/40">Материалы</Link>
          <Link href="/exams" className="shrink-0 rounded-full bg-white px-3 py-2 text-on-surface font-label-sm shadow-sm border border-outline-variant/40">Сессии</Link>
          <Link href="/settings" className="shrink-0 rounded-full bg-white px-3 py-2 text-on-surface font-label-sm shadow-sm border border-outline-variant/40">Тариф</Link>
        </div>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Кабинет студента</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Ваши материалы, тренировки и прогресс — в одном месте.</p>
          </div>
        </header>

        {children}
      </main>
      <AuthModal />
    </div>
  );
}
