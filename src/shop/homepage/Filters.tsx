import { useState } from 'react';

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

export function Filters() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const [lengthOpen, setLengthOpen] = useState(false);
  const [searchNamesOnly, setSearchNamesOnly] = useState(false);
  const PRICE_MIN = 995;
  const PRICE_MAX = 1250000;
  const [priceMin, setPriceMin] = useState(995);
  const [priceMax, setPriceMax] = useState(1250000);

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

  const closeAll = () => {
    setCategoriesOpen(false);
    setExtensionsOpen(false);
    setLengthOpen(false);
  };

  return (
    <section className="w-full pb-6 pt-0">
      {/* Filter box: no shadow, no outer border */}
      <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6">
        {/* Top row: CATEGORIES, EXTENSIONS, LENGTH, PRICE RANGE – centered */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 items-end">
          <div className="flex flex-wrap justify-center gap-3">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <button
                type="button"
                onClick={() => { setCategoriesOpen(!categoriesOpen); setExtensionsOpen(false); setLengthOpen(false); }}
                className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
              >
                <span>CATEGORIES</span>
                {chevron}
              </button>
              {categoriesOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1">
                  {dropdownOptions.categories.map((opt) => (
                    <li key={opt}>
                      <button type="button" onClick={closeAll} className="w-full text-left px-3 py-2 text-base text-[#6c7a89] hover:bg-gray-50">
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <button
                type="button"
                onClick={() => { setExtensionsOpen(!extensionsOpen); setCategoriesOpen(false); setLengthOpen(false); }}
                className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
              >
                <span>EXTENSIONS</span>
                {chevron}
              </button>
              {extensionsOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1">
                  {dropdownOptions.extensions.map((opt) => (
                    <li key={opt}>
                      <button type="button" onClick={closeAll} className="w-full text-left px-3 py-2 text-base text-[#6c7a89] hover:bg-gray-50">
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <button
                type="button"
                onClick={() => { setLengthOpen(!lengthOpen); setCategoriesOpen(false); setExtensionsOpen(false); }}
                className="w-full min-h-[48px] flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl text-base text-[#6c7a89] hover:bg-gray-50 shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
              >
                <span>LENGTH</span>
                {chevron}
              </button>
              {lengthOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-[#f0f0f0] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.2)] py-1">
                  {dropdownOptions.length.map((opt) => (
                    <li key={opt}>
                      <button type="button" onClick={closeAll} className="w-full text-left px-3 py-2 text-base text-[#6c7a89] hover:bg-gray-50">
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

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
              Price ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bottom row: Search centered | Toggle to the right */}
        <div className="mt-5 pt-5 flex flex-col sm:flex-row gap-4 items-center sm:justify-between">
          <div className="relative w-full sm:flex-1 flex justify-center max-w-sm mx-auto">
            <input
              type="search"
              placeholder="Search Everything"
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
  );
}
