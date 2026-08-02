export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center w-full">
      <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 mb-4">construction</span>
      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">В разработке</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
        Этот раздел находится в стадии разработки. Скоро здесь появится новый функционал.
      </p>
    </div>
  );
}
