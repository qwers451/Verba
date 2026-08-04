'use client';

import { useEffect, useState } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

export default function SettingsPage() {
  const { user, plans, payments, fetchPlans, fetchPayments, createYookassaCheckout, isCheckingOut } = useVerbaStore();
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { void fetchPlans(); void fetchPayments(); }, [fetchPlans, fetchPayments]);
  const checkout = async () => {
    setMessage(null);
    try {
      const confirmationUrl = await createYookassaCheckout();
      window.location.assign(confirmationUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось создать платёж.'); }
  };
  return <div className="max-w-5xl mx-auto grid gap-6">
    <section className="glass-card rounded-xl p-6"><p className="text-secondary font-label-sm text-label-sm">ПРОФИЛЬ</p><h2 className="mt-2 font-headline-md text-[24px] text-on-surface">{user?.name ?? 'Студент'}</h2><p className="mt-1 text-on-surface-variant">{user?.email ?? 'Загрузка профиля…'}</p><div className="mt-5 rounded-xl bg-surface-container-low p-4 flex flex-wrap justify-between gap-3"><span className="text-on-surface">Тариф: <b>{user?.subscription_title ?? '—'}</b></span><span className="text-on-surface-variant">Осталось сессий: {user?.sessions_remaining ?? 0} из {user?.monthly_sessions_limit ?? 0}</span></div></section>
    <section className="glass-card rounded-xl p-6"><div className="flex gap-3 items-start"><span className="material-symbols-outlined text-secondary">payments</span><div><h2 className="font-headline-md text-[22px] text-on-surface">Тарифы и тестовая оплата</h2><p className="mt-1 text-on-surface-variant font-label-sm">Платёж создаётся в тестовом магазине ЮKassa: реальные деньги не списываются. После подтверждения вы вернётесь на эту страницу.</p></div></div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">{plans.map((plan) => <article key={plan.code} className={`rounded-xl p-5 border ${plan.is_current ? 'border-primary bg-primary-container/35' : 'border-outline-variant bg-surface-container-low'}`}><div className="flex justify-between gap-3"><h3 className="font-headline-md text-[20px] text-on-surface">{plan.title}</h3>{plan.is_current && <span className="text-secondary font-label-sm">Активен</span>}</div><p className="mt-3 text-primary font-headline-md text-[26px]">{plan.price_rub ? `${plan.price_rub} ₽/мес.` : 'Бесплатно'}</p><p className="mt-1 text-on-surface-variant">{plan.monthly_session_limit} сессии в месяц</p><ul className="mt-4 grid gap-2 text-on-surface-variant font-label-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">check</span>{feature}</li>)}</ul>{plan.code === 'pro' && !plan.is_current && <button onClick={() => void checkout()} disabled={isCheckingOut} className="mt-5 w-full rounded-xl bg-primary text-on-primary py-3 font-label-md disabled:opacity-60">{isCheckingOut ? 'Переходим в ЮKassa…' : 'Оплатить через ЮKassa (тест)'}</button>}</article>)}</div>
      {message && <p className="mt-4 rounded-lg bg-secondary-container p-3 text-on-secondary-container font-label-sm">{message}</p>}
    </section>
    <section className="glass-card rounded-xl p-6"><h2 className="font-headline-md text-[20px] text-on-surface">История операций</h2>{payments.length === 0 ? <p className="mt-3 text-on-surface-variant">Тестовых операций пока нет.</p> : <div className="mt-4 grid gap-2">{payments.map((payment) => <div key={payment.id} className="rounded-lg bg-surface-container-low p-3 flex justify-between gap-3"><span className="text-on-surface">Pro · ЮKassa (тест)</span><span className="text-secondary">{payment.amount_rub} ₽ · {payment.status}</span></div>)}</div>}</section>
  </div>;
}
