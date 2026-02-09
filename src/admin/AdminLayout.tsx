import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import { AdminLogo } from './components';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/catalog', label: 'Catalog', icon: 'grid' },
  { to: '/admin/sales', label: 'Sales', icon: 'chart' },
  { to: '/admin/domain-requests', label: 'Domain Requests', icon: 'doc' },
  { to: '/admin/navigation-menus', label: 'NavigationMenus', icon: 'doc' },
  { to: '/admin/content', label: 'ContentMgt', icon: 'doc' },
  { to: '/admin/blogs', label: 'Blogs', icon: 'doc' },
  { to: '/admin/bulk-upload', label: 'BulkUpload', icon: 'doc' },
  { to: '/admin/keywords', label: 'Keywords', icon: 'doc' },
  { to: '/admin/wishlist', label: 'Wishlist', icon: 'doc' },
  { to: '/admin/recently-sold', label: 'Recently Sold', icon: 'doc' },
  { to: '/admin/customers', label: 'Customers', icon: 'person' },
  { to: '/admin/velocity', label: 'Velocity', icon: 'doc' },
  { to: '/admin/cms', label: 'CMS', icon: 'doc' },
  { to: '/admin/payment-verifications', label: 'Offline Payments', icon: 'payment' },
];

const catalogItems = [
  { label: 'Products', to: '/admin/catalog/products' },
  { label: 'Attributes', to: '/admin/catalog/attributes' },
  { label: 'Categories', to: '/admin/catalog/categories' },
  { label: 'Attribute Families', to: '/admin/catalog/attribute-families' },
];

const salesItems = [
  { label: 'Orders', to: '/admin/sales/orders' },
  { label: 'Shipments', to: '/admin/sales/shipments' },
  { label: 'Invoices', to: '/admin/sales/invoices' },
  { label: 'Refund', to: '/admin/sales/refunds' },
  { label: 'Transaction', to: '/admin/sales/transactions' },
];

function SidebarIcon({ name }: { name: string }) {
  if (name === 'dashboard')
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  if (name === 'chart')
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  if (name === 'grid')
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  if (name === 'person')
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  if (name === 'payment')
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CatalogDropdown({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isCatalogActive = location.pathname.startsWith('/admin/catalog');

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.top, left: rect.right });
  }, [isOpen]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className={`flex items-center gap-3 px-4 py-2.5 text-base font-medium transition-colors cursor-pointer rounded-r-md border-l-4 ${
          isOpen ? 'bg-[#d4e5f7] text-gray-900 border-l-transparent' : isCatalogActive
            ? 'bg-[#3898ec] text-white border-l-[#1d5bbf]'
            : 'border-l-transparent text-gray-700 hover:bg-[#d4e5f7] hover:text-gray-900'
        }`}
      >
        <SidebarIcon name="grid" />
        <span className="flex-1">Catalog</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen &&
        createPortal(
          <div
            className="fixed w-48 bg-white border border-gray-200 shadow-lg rounded-r-md z-[9999] py-1"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {catalogItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-base transition-colors ${
                    isActive ? 'bg-[#3898ec] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

function SalesDropdown({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isSalesActive = location.pathname.startsWith('/admin/sales');

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.top, left: rect.right });
  }, [isOpen]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <NavLink
        to="/admin/sales/orders"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 text-base font-medium transition-colors rounded-r-md border-l-4 ${
            isActive || isSalesActive ? 'bg-[#3898ec] text-white border-l-[#1d5bbf]' : isOpen ? 'bg-[#d4e5f7] text-gray-900 border-l-transparent' : 'border-l-transparent text-gray-700 hover:bg-[#d4e5f7] hover:text-gray-900'
          }`
        }
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="flex-1">Sales</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </NavLink>

      {isOpen &&
        createPortal(
          <div
            className="fixed w-48 bg-white border border-gray-200 shadow-lg rounded-r-md z-[9999] py-1"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {salesItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/admin/sales/orders'}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-base transition-colors ${
                    isActive ? 'bg-[#3898ec] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
  const dropdownOpen = catalogDropdownOpen || salesDropdownOpen;

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#f0f2f5]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#e8eaed] border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <AdminLogo size="md" />
        </div>
        <nav className={`flex-1 py-2 scrollbar-thin hover:scrollbar-thumb-gray-400 scrollbar-thumb-gray-200 scrollbar-track-transparent ${dropdownOpen ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
          {sidebarLinks.map((link) => {
            if (link.to === '/admin/sales') {
              return <SalesDropdown key={link.to} onOpenChange={setSalesDropdownOpen} />;
            }
            if (link.to === '/admin/catalog') {
              return <CatalogDropdown key={link.to} onOpenChange={setCatalogDropdownOpen} />;
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-base font-medium transition-colors rounded-r-md border-l-4 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#3898ec] text-white border-l-[#1d5bbf]'
                      : 'border-l-transparent text-gray-700 hover:bg-[#d4e5f7] hover:text-gray-900'
                  }`
                }
              >
                <SidebarIcon name={link.icon} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top header */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-6 min-w-0">
          
            <div className="flex-1 max-w-md flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Mega Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-base w-full placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" aria-label="Dark mode">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" aria-label="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button type="button" className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6 6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3898ec] text-[10px] font-medium text-white">49</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#3898ec] text-white font-medium text-base hover:bg-[#2d7bc4] transition-colors"
              aria-label="Account"
            >
              B
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto w-full px-4 py-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
