'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import React from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
};

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.getReminderCount();
      if (res?.success) setReminderCount(res.data.count);
    } catch {}
  };

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Vehicles',
      href: '/vehicles',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'New Entry',
      href: '/vehicles/new',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      name: 'Service Reminders',
      href: '/reminders',
      badge: reminderCount,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      name: 'Stations',
      href: '/stations',
      roles: ['admin'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        </svg>
      ),
    },
    {
      name: 'Staff',
      href: '/users',
      roles: ['admin'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const visible = navigation.filter((item) => {
    if (!item.roles) return true;
    if (item.roles.includes(user?.role || '')) return true;
    if (item.href === '/users' && user?.permissions?.includes('staff.view')) return true;
    return false;
  });

  return (
    <nav className="px-3 py-5 space-y-1">
      {visible.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavClick}
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              active
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
              {item.icon}
            </span>
            <span className="ml-3 flex-1">{item.name}</span>
            {!!item.badge && item.badge > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* ── DESKTOP: always-visible sticky sidebar (hidden on < lg) ── */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
        <NavLinks />
      </aside>

      {/* ── MOBILE: full-screen overlay drawer (only rendered when open) ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* drawer panel */}
          <aside className="relative z-10 flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl overflow-y-auto">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900 text-sm">Service Station</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <NavLinks onNavClick={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
