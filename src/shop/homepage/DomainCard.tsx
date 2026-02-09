// DomainListing type for DomainCard component
export interface DomainListing {
  id: string;
  displayName: string;
  price?: string;
  coverImage?: string;
  logoImage?: string;
  logoType?: 'ohr' | 'flake' | 'visuals' | 'gymeverywhere' | 'default';
}

interface DomainCardProps {
  item: DomainListing;
  onAddToCart?: (domain: DomainListing) => void;
  onAddToWishlist?: (domain: DomainListing) => void;
  isInCart?: boolean;
  isInWishlist?: boolean;
}

function CoverVisual({ item }: { item: DomainListing }) {
  if (item.coverImage) {
    return (
      <img
        src={item.coverImage}
        alt={item.displayName}
        className="w-full h-full object-cover"
      />
    );
  }

  if (item.logoImage) {
    return (
      <img
        src={item.logoImage}
        alt={item.displayName}
        className="w-full h-full object-cover"
      />
    );
  }

  const { logoType, displayName } = item;
  if (logoType === 'ohr') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-teal-400">
        <div className="text-center">
          <span className="block font-bold text-black text-2xl sm:text-3xl">OHR</span>
          <span className="block text-base sm:text-lg font-bold text-black bg-red-500 text-white px-2 py-0.5 rounded">.com</span>
        </div>
      </div>
    );
  }
  if (logoType === 'flake') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-100">
        <span className="text-[#3898ec] font-semibold text-xl sm:text-2xl text-center">flake.ai</span>
      </div>
    );
  }
  if (logoType === 'visuals') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-red-600 font-bold text-[32px] sm:text-[36px]">V</span>
        <span className="text-[#2c3e50] font-semibold text-lg sm:text-xl ml-1">VISUALS.AI</span>
      </div>
    );
  }
  if (logoType === 'gymeverywhere') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
        <span className="text-[#3898ec] font-bold text-3xl sm:text-[32px]">G E</span>
        <span className="text-orange-500 text-base sm:text-lg font-medium mt-1">Gym Everywhere</span>
      </div>
    );
  }
  if (logoType === 'default') {
    const extension = displayName.includes('.')
      ? '.' + displayName.split('.').pop()
      : '';
    const name = displayName.replace(/\.[^/.]+$/, '');
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
        <span className="text-[#2c3e50] font-semibold text-lg sm:text-xl md:text-2xl text-center break-all">
          <span className="font-bold">{name}</span>
          <span className="text-[#3898ec]">{extension}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#d3dce6] p-4">
      <span className="text-[#2c3e50] font-semibold text-xl sm:text-2xl md:text-3xl text-center break-all">
        {displayName}
      </span>
    </div>
  );
}

// Heart icon for wishlist
function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg 
      className={`w-5 h-5 ${filled ? 'fill-red-500 text-red-500' : 'text-white'}`} 
      fill={filled ? 'currentColor' : 'none'} 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

// Shopping cart icon
function CartIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

import { Link } from 'react-router-dom';

export function DomainCard({ 
  item, 
  onAddToCart, 
  onAddToWishlist, 
  isInCart = false, 
  isInWishlist = false 
}: DomainCardProps) {
  return (
    <Link to={`/domain/${item.id}`} className="block h-full">
      <article className="bg-white rounded-[8px] border border-[#d3dce6] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow h-full flex flex-col group">
      {/* Cover: image or domain/logo visual - increased height */}
      <div className="min-h-0 relative flex-shrink-0 h-[140px] sm:h-[160px] lg:h-[180px]">
        <CoverVisual item={item} />
        
        {/* Action buttons - column layout from top right corner - visible on hover */}
        {(onAddToCart || onAddToWishlist) && (
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onAddToWishlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWishlist(item);
                }}
                className="p-1.5 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <HeartIcon filled={isInWishlist} />
              </button>
            )}
            {onAddToCart && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isInCart ? 'bg-green-500 hover:bg-green-600' : 'bg-black/40 hover:bg-black/60'
                }`}
                title={isInCart ? 'In cart' : 'Add to cart'}
              >
                <CartIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: domain name (left) and price (right) */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-[#d3dce6] bg-white flex justify-between items-center">
        <div className="min-w-0 mr-3">
          <p className="text-base sm:text-lg font-semibold text-[#2c3e50] truncate">
            {item.displayName}
          </p>
        </div>
        {item.price && (
          <p className="text-[#3898ec] font-bold text-lg shrink-0 whitespace-nowrap">
            {item.price}
          </p>
        )}
      </div>
      </article>
    </Link>
  );
}
