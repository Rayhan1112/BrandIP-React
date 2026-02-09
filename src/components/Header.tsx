import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart, removeFromCart, CART_UPDATED_EVENT } from '../services/cartService';

const BRANDIP_LOGO_URL = 'https://brandip.com/domain-names-for-sale/storage/app/public/channel/1/new-logo.png';

const navLinks = [
  { label: 'Names for Sale', to: '/' },
  { label: 'Branding', to: '/branding' },
  { label: 'Trademark', to: '#' },
  { label: 'Patent', to: '/patent' },
  { label: 'Startups', to: '/startup' },
];

interface CartItem {
  id: string;
  domainId: string;
  domainName: string;
  domainPrice: number;
  logoImage: string;
  quantity: number;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, logOut, isLoading } = useAuth();

  // Load cart items from Firestore (same cartUserId as add-to-cart)
  const loadCart = async () => {
    try {
      const cartRes = await getCart();
      setCartItems(cartRes.items);
      setCartCount(cartRes.items.length);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Load cart once auth has finished (so we use correct uid vs guest id)
  useEffect(() => {
    if (!isLoading) loadCart();
  }, [isLoading]);

  useEffect(() => {
    const onCartUpdated = () => loadCart();
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setCartOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (isLoading) {
      setTimeout(() => {
        if (user) {
          setProfileOpen(true);
        }
      }, 100);
    } else {
      setProfileOpen(!profileOpen);
      setCartOpen(false);
    }
  };

  const handleCartClick = () => {
    const willOpen = !cartOpen;
    setCartOpen(willOpen);
    setProfileOpen(false);
    // Refetch cart when opening dropdown so items are up to date
    if (willOpen) loadCart();
  };

  const handleSignIn = () => {
    setProfileOpen(false);
    navigate('/signin');
  };

  const handleSignUp = () => {
    setProfileOpen(false);
    navigate('/signup');
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logOut();
    navigate('/');
  };

  const handleRemoveFromCart = async (itemId: string) => {
    setCartLoading(true);
    const result = await removeFromCart(itemId);
    if (result.success) {
      await loadCart();
    }
    setCartLoading(false);
  };

  const handleViewCart = () => {
    setCartOpen(false);
    navigate('/profile/cart');
  };

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.domainPrice * item.quantity, 0);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(180deg, var(--color-brandip-gradient-top) 0%, var(--color-brandip-gradient-mid) 100%)',
      }}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Call, Contact us, Account, Cart (right) */}
        <div className="flex justify-end mt-2 items-center gap-4 sm:gap-6 text-[18px] py-1.5">
          <a href="tel:6506877111" className="text-black hover:text-black whitespace-nowrap">
            Call (650) 687-7111
          </a>
          <a href="#contact" className="text-black hover:text-black whitespace-nowrap">
            Contact us
          </a>

          {/* Profile Icon with Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="p-1 text-[#6c7a89] hover:text-[#3898ec] relative"
              aria-label="Account"
              onClick={handleProfileClick}
            >
              {isLoading ? (
                <div className="w-[22px] h-[22px] animate-pulse bg-gray-300 rounded-full" />
              ) : isAuthenticated ? (
                <div className="w-[22px] h-[22px] rounded-full bg-[#3898ec] flex items-center justify-center text-white text-xs font-medium">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleViewCart}
                    >
                      Cart {cartCount > 0 && `(${cartCount})`}
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-600">Sign in to your account</p>
                    </div>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleSignIn}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-[#3898ec] font-medium hover:bg-gray-100"
                      onClick={handleSignUp}
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon with Dropdown */}
          <div className="relative" ref={cartRef}>
            <button
              type="button"
              className="relative p-1 text-[#6c7a89] hover:text-[#3898ec]"
              aria-label="Cart"
              onClick={handleCartClick}
            >
              <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3898ec] text-[12px] font-medium text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Cart Dropdown */}
            {cartOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Shopping Cart</h3>
                </div>
                
                {cartItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Your cart is empty</p>
                    <button
                      type="button"
                      className="mt-3 text-sm text-[#3898ec] hover:underline"
                      onClick={() => setCartOpen(false)}
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 border-b border-gray-100 flex items-start gap-3 last:border-b-0">
                          {item.logoImage && (
                            <img
                              src={item.logoImage}
                              alt={item.domainName}
                              className="w-12 h-12 object-cover rounded bg-gray-100"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.domainName}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(item.domainPrice)}</p>
                          </div>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500 p-1"
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={cartLoading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-2 px-4 bg-[#2c3e50] text-white text-sm font-medium rounded hover:bg-[#34495e] transition-colors"
                        onClick={handleCheckout}
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav links: directly under top bar */}
        <nav className="pt-0.5 pb-2" aria-label="Main">
          <button
            type="button"
            className="md:hidden flex items-center gap-2 text-black py-1"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
          >
            {menuOpen ? 'Close' : 'Menu'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <ul
            className={`flex flex-col md:flex-row md:justify-end md:items-center mt-2 gap-4 md:gap-6 lg:gap-8 font-medium ${menuOpen ? 'block pt-2' : 'hidden md:flex'}`}
          >
            {navLinks.map((link) => (
              <li key={link.label}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `block py-2 md:py-0 border-b-2 border-transparent md:pb-1 transition-colors ${
                      isActive ? 'text-black border-black' : 'text-black hover:text-black border-transparent'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logo row */}
        <div className="flex flex-wrap items-center justify-between gap-2 -mt-14 pt-0 pb-3">
          <a href="https://brandip.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 pl-2 sm:pl-0">
            <img src={BRANDIP_LOGO_URL} alt="Brandip" className="h-[40px] w-[154px] shrink-0 object-contain" />
          </a>
        </div>
      </div>
    </header>
  );
}
