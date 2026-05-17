// frontend/src/components/Layout/Layout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const FULL_BLEED_ROUTES = ['/tracking', '/map'];

const Layout = () => {
  const { pathname } = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.some((r) => pathname.endsWith(r));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/*
        CRITICAL FIX — stacking context for the sidebar column.

        Problem: Leaflet creates its own stacking context internally with
        high z-indexes (400+). Because the sidebar is a flex sibling of
        the map container and has no z-index of its own, Leaflet's layers
        paint over it even though the sidebar appears later in the DOM.

        Solution:
          1. Wrap the sidebar in a <div> with `position: relative` and
             `z-index: 1` so it forms its own stacking context that sits
             ABOVE the map's flex sibling (which gets z-index: 0 implicitly).
          2. Add `isolation: isolate` to the right column (map + navbar) so
             Leaflet's internal z-indexes are confined within it and cannot
             bleed out to compete with the sidebar.

        On desktop the sidebar is sticky/in-flow — this wrapper is what
        gives it stacking precedence over the map column.
        On mobile the sidebar is fixed — it already escapes flow, but the
        z-index on this wrapper still anchors the stacking order correctly.
      */}
      <div className="relative z-10 flex-shrink-0">
        <Sidebar />
      </div>

      {/*
        `isolation: isolate` creates a new stacking context here.
        Leaflet's panes (z-index 200/400/600 etc.) are now scoped
        inside this column and cannot paint over the sidebar above.
      */}
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ isolation: 'isolate' }}
      >
        <Navbar />

        {isFullBleed ? (
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};

export default Layout;