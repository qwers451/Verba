'use client';

import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <nav className="bg-surface-container-low text-primary font-label-md text-label-md h-screen w-64 fixed left-0 top-0 flex flex-col p-base gap-base hidden md:flex border-r border-surface-container-high z-10">
      {/* Header */}
      <div className="px-4 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-headline-md text-headline-md">
          OA
        </div>
        <div>
          <div className="font-headline-md text-[18px] font-bold text-primary">Study Workspace</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">Academic Mode</div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-2 mb-6">
        <button className="w-full bg-secondary text-on-secondary rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Start New Mock Interview
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1 px-2">
        {/* Active Tab: Home */}
        <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg group active:scale-[0.98] transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          Home
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group">
          <span className="material-symbols-outlined">record_voice_over</span>
          My Exams
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group">
          <span className="material-symbols-outlined">psychology</span>
          AI Coach
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
      </div>

      {/* Footer Tab */}
      <div className="px-2 mt-auto pb-4">
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group">
          <span className="material-symbols-outlined">help</span>
          Help Center
        </Link>
      </div>
    </nav>
  );
}
