// frontend/src/components/Layout/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  TruckIcon,
  UserIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  CubeIcon,
  MapIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import {
  HomeIcon as HomeSolidIcon,
  TruckIcon as TruckSolidIcon,
  UserIcon as UserSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  MapPinIcon as MapPinSolidIcon,
  CubeIcon as CubeSolidIcon,
  MapIcon as MapSolidIcon,
  Cog6ToothIcon as CogSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
} from '@heroicons/react/24/solid';

// ─── Menu Definitions ────────────────────────────────────────────────────────

const ADMIN_MENU = [
  {
    section: 'Overview',
    items: [
      {
        path: '/dashboard',
        icon: HomeIcon,
        solidIcon: HomeSolidIcon,
        label: 'Dashboard',
        description: 'Overview & analytics',
      },
    ],
  },
  {
    section: 'Fleet',
    items: [
      {
        path: '/dashboard/trucks',
        icon: TruckIcon,
        solidIcon: TruckSolidIcon,
        label: 'Trucks',
        description: 'Manage fleet vehicles',
      },
      //   {
      //   path: '/dashboard/truck-history',
      //   icon: ClipboardDocumentListIcon,
      //   solidIcon: ClipboardDocumentListIcon,
      //   label: 'Truck History',
      //   description: 'View trip history per truck',
      // },
      {
        path: '/dashboard/drivers',
        icon: UserIcon,
        solidIcon: UserSolidIcon,
        label: 'Drivers',
        description: 'Driver management',
      },
      // {
      //   path: '/dashboard/driver-history',
      //   icon: ChartBarIcon,
      //   solidIcon: ChartBarSolidIcon,
      //   label: 'Driver History',
      //   description: 'View driver performance & trip logs',
      // },
      {
        path: '/dashboard/devices',
        icon: WrenchScrewdriverIcon,
        solidIcon: WrenchScrewdriverIcon,
        label: 'Devices',
        description: 'Manage IoT devices',
      },
      {
        path: '/dashboard/driver-scores',
        icon: ChartBarIcon,
        solidIcon: ChartBarSolidIcon,
        label: 'Driver Scores',
        description: 'Configure scoring rules & view history',
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        path: '/dashboard/tracking',
        icon: MapPinIcon,
        solidIcon: MapPinSolidIcon,
        label: 'Live Map',
        description: 'Real-time tracking',
      },
      {
        path: '/dashboard/trips',
        icon: ClipboardDocumentListIcon,
        solidIcon: ClipboardDocumentListIcon,
        label: 'Trip History',
        description: 'View all trip logs',
      },
      {
        path: '/dashboard/gate-management',
        icon: ArrowUpTrayIcon,
        solidIcon: ArrowUpTrayIcon,
        label: 'Gate Management',
        description: 'Entry / exit control',
      },
      {
        path: '/dashboard/shipments',
        icon: CubeIcon,
        solidIcon: CubeSolidIcon,
        label: 'Shipments',
        description: 'Manage all shipments (create, edit, assign)',
      },
    ],
  },
  {
    section: 'Admin',
    items: [
      {
        path: '/dashboard/users',
        icon: UserGroupIcon,
        solidIcon: UserGroupSolidIcon,
        label: 'Users',
        description: 'Roles & permissions',
      },
    ],
  },
];

const SHIPMENT_MANAGER_MENU = [
  {
    section: 'Overview',
    items: [
      {
        path: '/shipment_manager',
        icon: HomeIcon,
        solidIcon: HomeSolidIcon,
        label: 'Dashboard',
        description: 'Daily operations',
      },
    ],
  },
  {
    section: 'Shipments',
    items: [
      {
        path: '/shipment_manager/shipments',
        icon: CubeIcon,
        solidIcon: CubeSolidIcon,
        label: 'Shipments',
        description: 'Manage deliveries',
      },
      {
        path: '/shipment_manager/shipments/create',
        icon: ArrowUpTrayIcon,
        solidIcon: ArrowUpTrayIcon,
        label: 'Create Shipment',
        description: 'Add new delivery',
      },
      {
        path: '/shipment_manager/tracking',
        icon: MapIcon,
        solidIcon: MapSolidIcon,
        label: 'Live Map',
        description: 'Fleet tracking',
      },
      {
        path: '/shipment_manager/trips',
        icon: ClipboardDocumentListIcon,
        solidIcon: ClipboardDocumentListIcon,
        label: 'Trip History',
        description: 'View all trip logs',
      },
    ],
  },
];

// ─── NavItem Component ────────────────────────────────────────────────────────

const NavItem = ({ item, isOpen, searchQuery }) => {
  const highlight = (text) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5">
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard' || item.path === '/shipment_manager' || item.path === '/dashboard/profile'}
      className={({ isActive }) =>
        [
          'group relative flex items-center px-3 py-2.5 my-0.5 rounded-xl transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white'
            : 'text-gray-300 hover:bg-white/10 hover:text-white',
          !isOpen && 'lg:justify-center lg:px-2',
        ].join(' ')
      }
    >
      {({ isActive }) => {
        const Icon = isActive && item.solidIcon ? item.solidIcon : item.icon;
        return (
          <>
            {isActive && (
              <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
            )}
            <Icon
              className={[
                'h-5 w-5 flex-shrink-0 transition-colors',
                isOpen ? 'mr-3' : 'lg:mr-0',
                isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200',
              ].join(' ')}
            />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium leading-tight">{highlight(item.label)}</span>
                <span className="block text-xs text-gray-500 leading-tight mt-0.5 truncate">
                  {highlight(item.description)}
                </span>
              </div>
            )}
          </>
        );
      }}
    </NavLink>
  );
};

// ─── SectionLabel Component ───────────────────────────────────────────────────

const SectionLabel = ({ label, isOpen }) => {
  if (!isOpen) {
    return <div className="h-px bg-white/10 mx-2 my-3" />;
  }
  return (
    <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase px-3 pt-5 pb-1.5 select-none">
      {label}
    </p>
  );
};

// ─── SearchInput Component ────────────────────────────────────────────────────

const SearchInput = ({ value, onChange, onClear, inputRef }) => (
  <div className="mx-3 mb-3 relative">
    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search…"
      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Clear search"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

// ─── Sidebar Component ────────────────────────────────────────────────────────

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setSearchQuery('');
  }, [location]);

  useEffect(() => {
    const handleKey = (e) => {
      if (
        (e.key === '/' || (e.ctrlKey && e.key === 'k')) &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 150);
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'admin';
  const menuGroups = isAdmin ? ADMIN_MENU : SHIPMENT_MANAGER_MENU;
  const roleLabel = isAdmin ? 'Administrator' : 'Shipment Manager';
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  const filteredGroups = searchQuery.trim()
    ? menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0)
    : menuGroups;

  const totalResults = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed lg:sticky top-0 left-0 h-screen z-50',
          'bg-gradient-to-b from-gray-900 to-gray-800 text-white',
          'flex flex-col shadow-2xl',
          'transition-all duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isOpen ? 'w-72' : 'lg:w-20',
        ].join(' ')}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-purple-500" />

        {/* Header */}
        <div
          className={[
            'flex items-center pt-5 pb-4 px-4',
            !isOpen ? 'lg:justify-center' : 'justify-between',
          ].join(' ')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-base font-bold">FM</span>
            </div>
            {isOpen && (
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight truncate">Fleet Manager</h1>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{roleLabel}</p>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2 flex-shrink-0"
          >
            <ChevronLeftIcon
              className={[
                'h-4 w-4 transition-transform duration-300',
                !isOpen && 'rotate-180',
              ].join(' ')}
            />
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* User profile pill */}
        <div className={['mx-3 mb-3 p-3 bg-white/5 rounded-xl', !isOpen && 'lg:mx-2'].join(' ')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">{userInitial}</span>
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Search input (expanded) */}
        {isOpen && (
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            inputRef={searchInputRef}
          />
        )}

        {/* Collapsed search icon */}
        {!isOpen && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 200);
              }}
              aria-label="Search pages"
              title="Search pages"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className={['px-3 pb-4', !isOpen && 'lg:px-2'].join(' ')}>
            {isSearching && totalResults === 0 && (
              <div className="text-center py-8 px-3">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No pages match</p>
                <p className="text-[10px] text-gray-600 mt-1">"{searchQuery}"</p>
              </div>
            )}
            {isSearching && totalResults > 0 && (
              <p className="text-[10px] text-gray-500 px-3 pt-2 pb-1">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </p>
            )}
            {filteredGroups.map((group) => (
              <div key={group.section}>
                <SectionLabel label={group.section} isOpen={isOpen} />
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    isOpen={isOpen}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            ))}
          </div>
          {isOpen && !isSearching && (
            <div className="px-3 pb-2">
              <p className="text-[10px] text-gray-700 text-center">
                Press{' '}
                <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-gray-600">/</kbd>
                {' '}or{' '}
                <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-gray-600">Ctrl K</kbd>
                {' '}to search
              </p>
            </div>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-white/10">
          <div className="p-3">
            <button
              onClick={handleLogout}
              className={[
                'group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200',
                'text-gray-400 hover:text-red-400 hover:bg-red-500/10',
                !isOpen && 'lg:justify-center',
              ].join(' ')}
              title={!isOpen ? 'Logout' : ''}
            >
              <ArrowRightOnRectangleIcon
                className={['h-5 w-5 flex-shrink-0', isOpen && 'mr-3'].join(' ')}
              />
              {isOpen && <span className="text-sm font-medium">Logout</span>}
              {!isOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  Logout
                </div>
              )}
            </button>
          </div>
          <div className={['pb-4 text-center', !isOpen && 'px-0'].join(' ')}>
            {isOpen ? (
              <p className="text-[10px] text-gray-600">Fleet Manager v2.0.0</p>
            ) : (
              <div className="flex justify-center">
                <span className="text-[10px] text-gray-600 bg-white/5 rounded-md px-1.5 py-0.5">v2</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;