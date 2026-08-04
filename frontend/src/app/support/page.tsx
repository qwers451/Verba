import Link from 'next/link';

export default function SupportPage() {
  return <main className="min-h-screen bg-background px-4 py-12 text-on-surface"><section className="mx-auto max-w-3xl glass-card rounded-2xl p-8"><h1 className="font-headline-lg text-3xl">Поддержка Verba AI</h1><p className="mt-5 text-on-surface-variant">Если загрузка материала, оплата или тренировочная сессия завершились ошибкой, сохраните текст сообщения и укажите название браузера и время возникновения проблемы.</p><div className="mt-7 rounded-xl bg-surface-container-low p-5"><p className="font-label-md">Сообщить о проблеме</p><a href="https://github.com/qwers451/Verba/issues/new" target="_blank" rel="noreferrer" className="mt-2 inline-block text-secondary hover:underline">Создать обращение в репозитории проекта</a></div><Link href="/" className="inline-block mt-8 text-secondary hover:underline">Вернуться на главную</Link></section></main>;
}
