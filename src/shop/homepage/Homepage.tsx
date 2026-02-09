import { useState, useEffect, useMemo } from 'react';
import { DomainCard, type DomainListing } from './DomainCard';
import { BrowseCategories } from './BrowseCategories';
import { RecentlySoldAndFAQ } from './RecentlySoldAndFAQ';
import { Hero } from './Hero';
import { ResultsBar } from './ResultsBar';
import { fetchProductsFromPhp, productToDomainListing } from '../../services/phpApiService';
import { addToCart, addToWishlist, getCart, getUserWishlist, notifyCartUpdated } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { ShimmerGrid } from '../../components/Shimmer';

const PER_PAGE = 24;

const dropdownOptions = {
  categories: ['All Categories', 'Tech', 'Health', 'Finance'],
  extensions: ['.com', '.ai', '.io', '.co'],
  length: ['Any', 'Short (1-6)', 'Medium (7-12)', 'Long (13+)'],
};

const chevron = (
  <svg className="w-4 h-4 shrink-0 text-[#6c7a89]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Helper function to get domain length
function getDomainLength(name: string): number {
  const baseName = name.split('.')[0];
  return baseName.length;
}

// Helper function to get domain extension
function getDomainExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

export function Homepage() {
  const { user } = useAuth();
  
  // Filters state
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const [lengthOpen, setLengthOpen] = useState(false);
  const [searchNamesOnly, setSearchNamesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedExtension, setSelectedExtension] = useState('All');
  const [selectedLength, setSelectedLength] = useState('Any');
  const [searchTerm, setSearchTerm] = useState('');
  
  const PRICE_MIN = 995;
  const PRICE_MAX = 1250000;
  const [priceMin, setPriceMin] = useState(995);
  const [priceMax, setPriceMax] = useState(1250000);
  
  const [allDomains, setAllDomains] = useState<DomainListing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Cart and Wishlist state
  const [cartDomainIds, setCartDomainIds] = useState<Set<string>>(new Set());
  const [wishlistDomainIds, setWishlistDomainIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load all domains once so search/filters apply to full list
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductsFromPhp()
      .then((products) => {
        if (!cancelled) {
          setAllDomains(products.map(productToDomainListing));
        }
      })
      .catch(() => {
        if (!cancelled) setAllDomains([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Load cart (Laravel) and wishlist (Firebase when logged in)
  useEffect(() => {
    loadCartAndWishlist();
  }, [user]);

  const loadCartAndWishlist = async () => {
    try {
      const [cartRes, wishlistItems] = await Promise.all([
        getCart(),
        user ? getUserWishlist(user.uid) : Promise.resolve([]),
      ]);
      setCartDomainIds(new Set(cartRes.items.map((item) => item.domainId)));
      setWishlistDomainIds(new Set(wishlistItems.map((item) => item.domainId)));
    } catch (error) {
      console.error('Error loading cart/wishlist:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = async (domain: DomainListing) => {
    const result = await addToCart(domain.id);

    if (result.success) {
      notifyCartUpdated();
      showNotification(result.message || 'Added to cart!', 'success');
      // Refetch cart from backend so UI state matches DB (source of truth)
      try {
        const { items } = await getCart();
        setCartDomainIds(new Set(items.map((item) => item.domainId)));
      } catch (e) {
        setCartDomainIds((prev) => new Set(prev).add(domain.id));
      }
    } else {
      showNotification(result.message || 'Failed to add to cart', 'error');
    }
  };

  const handleAddToWishlist = async (domain: DomainListing) => {
    if (!user) {
      showNotification('Please sign in to add to wishlist', 'error');
      return;
    }

    const result = await addToWishlist(
      user.uid,
      domain.id,
      domain.displayName,
      parseInt(domain.price?.replace(/[^0-9]/g, '') || '0'),
      domain.logoImage || ''
    );

    if (result === 'already_exists') {
      showNotification('Already in wishlist', 'error');
    } else if (result) {
      setWishlistDomainIds(prev => new Set(prev).add(domain.id));
      showNotification('Added to wishlist!', 'success');
    } else {
      showNotification('Failed to add to wishlist', 'error');
    }
  };

  const priceRange = PRICE_MAX - PRICE_MIN;
  const minPercent = ((priceMin - PRICE_MIN) / priceRange) * 100;
  const maxPercent = ((priceMax - PRICE_MIN) / priceRange) * 100;

  const handlePriceMin = (v: number) => {
    setPriceMin(v);
    if (v > priceMax) setPriceMax(v);
  };
  
  const handlePriceMax = (v: number) => {
    setPriceMax(v);
    if (v < priceMin) setPriceMin(v);
  };

  const closeAllDropdowns = () => {
    setCategoriesOpen(false);
    setExtensionsOpen(false);
    setLengthOpen(false);
  };

  // Filter all domains (search + filters apply to full list)
  const filteredDomains = useMemo(() => {
    return allDomains.filter((domain) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (searchNamesOnly) {
          if (!domain.displayName.toLowerCase().includes(searchLower)) {
            return false;
          }
        } else {
          // Search in name, or if we had description/keywords we'd search those too
          if (!domain.displayName.toLowerCase().includes(searchLower)) {
            return false;
          }
        }
      }

      // Extension filter
      const domainExtension = getDomainExtension(domain.displayName);
      if (selectedExtension && selectedExtension !== 'All' && domainExtension !== selectedExtension) {
        return false;
      }

      // Length filter
      if (selectedLength !== 'Any') {
        const domainLen = getDomainLength(domain.displayName);
        if (selectedLength === 'Short (1-6)' && (domainLen < 1 || domainLen > 6)) {
          return false;
        }
        if (selectedLength === 'Medium (7-12)' && (domainLen < 7 || domainLen > 12)) {
          return false;
        }
        if (selectedLength === 'Long (13+)' && domainLen < 13) {
          return false;
        }
      }

      // Price filter
      const priceStr = domain.price || '$0';
      const priceValue = parseInt(priceStr.replace(/[^0-9]/g, ''));
      if (priceValue < priceMin || priceValue > priceMax) {
        return false;
      }

      return true;
    });
  }, [allDomains, searchTerm, searchNamesOnly, selectedExtension, selectedLength, priceMin, priceMax]);

  // Paginate filtered list: show 24 per page
  const totalFiltered = filteredDomains.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const pageStart = (currentPage - 1) * PER_PAGE;
  const domainsToShow = filteredDomains.slice(pageStart, pageStart + PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchNamesOnly, selectedExtension, selectedLength, priceMin, priceMax]);

  return (
    <div className="">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Hero Section - Domain Names For Sale */}
      <Hero />

      {/* Filters Section */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-0">
        {/* Filter box: no shadow, no outer border */}
        <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6">
          {/* Top row: CATEGORIES, EXTENSIONS, LENGTH, PRICE RANGE – centered */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 items-end">
            <div className="flex flex-wrap justify-center gap-3">
              {/* Categories Dropdown */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <button
                  type="button"
                  onClick={() => { setCategoriesOpen(!categoriesOpen); setExtensionsOpen(false); setLengthOpen(false); }}
                  className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
                >
                  <span className="truncate">CATEGORIES: {selectedCategory}</span>
                  {chevron}
                </button>
                {categoriesOpen && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1 max-h-60 overflow-y-auto">
                    {dropdownOptions.categories.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCategory(opt); closeAllDropdowns(); }}
                          className={`w-full text-left px-3 py-2 text-base hover:bg-gray-50 ${
                            selectedCategory === opt ? 'text-[#3898ec] font-semibold' : 'text-[#6c7a89]'
                          }`}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Extensions Dropdown */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <button
                  type="button"
                  onClick={() => { setExtensionsOpen(!extensionsOpen); setCategoriesOpen(false); setLengthOpen(false); }}
                  className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
                >
                  <span className="truncate">EXTENSION: {selectedExtension}</span>
                  {chevron}
                </button>
                {extensionsOpen && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSelectedExtension('All'); closeAllDropdowns(); }}
                        className={`w-full text-left px-3 py-2 text-base hover:bg-gray-50 ${
                          selectedExtension === 'All' ? 'text-[#3898ec] font-semibold' : 'text-[#6c7a89]'
                        }`}
                      >
                        All
                      </button>
                    </li>
                    {dropdownOptions.extensions.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          onClick={() => { setSelectedExtension(opt); closeAllDropdowns(); }}
                          className={`w-full text-left px-3 py-2 text-base hover:bg-gray-50 ${
                            selectedExtension === opt ? 'text-[#3898ec] font-semibold' : 'text-[#6c7a89]'
                          }`}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Length Dropdown */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <button
                  type="button"
                  onClick={() => { setLengthOpen(!lengthOpen); setCategoriesOpen(false); setExtensionsOpen(false); }}
                  className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
                >
                  <span className="truncate">LENGTH: {selectedLength}</span>
                  {chevron}
                </button>
                {lengthOpen && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1">
                    {dropdownOptions.length.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          onClick={() => { setSelectedLength(opt); closeAllDropdowns(); }}
                          className={`w-full text-left px-3 py-2 text-base hover:bg-gray-50 ${
                            selectedLength === opt ? 'text-[#3898ec] font-semibold' : 'text-[#6c7a89]'
                          }`}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="max-w-[240px] w-full shrink-0">
              <span className="block text-sm sm:text-base font-semibold uppercase tracking-wider text-[#6c7a89] mb-1 text-center">
                PRICE RANGE
              </span>
              <div className="relative h-6 w-full flex items-center">
                <div className="absolute left-0 right-0 h-2 rounded-full bg-[#d3dce6]" aria-hidden />
                <div
                  className="absolute h-2 rounded-full bg-[#3898ec] pointer-events-none"
                  style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                  aria-hidden
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={priceMin}
                  onChange={(e) => handlePriceMin(Number(e.target.value))}
                  className="range-thumb-only absolute left-0 w-full h-6 m-0 cursor-pointer z-10"
                  aria-label="Minimum price"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={priceMax}
                  onChange={(e) => handlePriceMax(Number(e.target.value))}
                  className="range-thumb-only absolute left-0 w-full h-6 m-0 cursor-pointer z-20"
                  aria-label="Maximum price"
                />
              </div>
              <p className="text-base text-[#6c7a89] mt-1 text-center">
                ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bottom row: Search centered | Toggle to the right */}
          <div className="mt-5 pt-5 flex flex-col sm:flex-row gap-4 items-center sm:justify-between">
            <div className="relative w-full sm:flex-1 flex justify-center max-w-sm mx-auto">
              <input
                type="search"
                placeholder="Search Everything"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 min-h-[44px] bg-white rounded-xl text-base text-[#6c7a89] placeholder-[#6c7a89]/80 focus:outline-none focus:ring-2 focus:ring-[#3898ec] focus:border-transparent shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c7a89] pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={searchNamesOnly}
                onClick={() => setSearchNamesOnly(!searchNamesOnly)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-0 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3898ec] focus:ring-offset-2 ${
                  searchNamesOnly ? 'bg-[#3898ec]' : 'bg-[#e0e0e0]'
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    searchNamesOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-base text-[#6c7a89]">Search In Names Only</span>
            </div>
          </div>
        </div>
      </section>

      {/* Results Bar */}
      <ResultsBar resultsCount={totalFiltered} />

      {/* Domain Cards Section */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <ShimmerGrid count={8} />
        ) : domainsToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {allDomains.length === 0 ? 'No domains available.' : 'No domains match your filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {domainsToShow.map((domain) => (
                <DomainCard
                  key={domain.id}
                  item={domain}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  isInCart={cartDomainIds.has(domain.id)}
                  isInWishlist={wishlistDomainIds.has(domain.id)}
                />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="px-4 py-2 rounded-lg bg-white border border-[#d3dce6] text-[#2c3e50] font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[#6c7a89] font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="px-4 py-2 rounded-lg bg-white border border-[#d3dce6] text-[#2c3e50] font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Browse Categories Section */}
      <BrowseCategories />

      {/* Recently Sold & FAQ Section */}
      <RecentlySoldAndFAQ />
    </div>
  );
}
