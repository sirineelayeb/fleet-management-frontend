// frontend/src/components/Layout/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const FULL_BLEED_ROUTES = ['/tracking', '/map'];

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return [isDark, setIsDark];
};

const Layout = () => {
  const { pathname } = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.some((r) => pathname.endsWith(r));
  const [isDark, setIsDark] = useDarkMode();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">

      <div className="relative z-10 flex-shrink-0">
        <Sidebar />
      </div>

      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ isolation: 'isolate' }}
      >
        <Navbar isDark={isDark} onToggleDark={() => setIsDark(d => !d)} />

        {isFullBleed ? (
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-950">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};

export default Layout;