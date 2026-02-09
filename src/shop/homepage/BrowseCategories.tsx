import { useState } from 'react';

const popularKeywords = [
  'Design',
  'Creative',
  'News',
  'Health',
  'Security',
  'Technology',
  'Education',
  'Finance',
  'Entertainment',
  'Food',
];

const industryCategories = [
  { iconType: 'aerospace', name: 'Aerospace' },
  { iconType: 'agency', name: 'Agency & Consulting' },
  { iconType: 'agriculture', name: 'Agriculture' },
  { iconType: 'animals', name: 'Animals, Environment & Nature' },
  { iconType: 'art', name: 'Art, Artist, Culture' },
  { iconType: 'audit', name: 'Audit, Security & Compliance' },
  { iconType: 'automation', name: 'Automation' },
  { iconType: 'automotive', name: 'Automotive, Automobile, Green Vehicles' },
  { iconType: 'beauty', name: 'Beauty & Cosmetics' },
];

const nameStyles = [
  { iconType: 'agriculture', name: 'Agriculture' },
  { iconType: 'audit', name: 'Audit, Security & Compliance' },
  { iconType: 'beauty', name: 'Beauty & Cosmetics' },
  { iconType: 'art', name: 'Art, Artist, Culture' },
  { iconType: 'animals', name: 'Animals, Environment & Nature' },
  { iconType: 'automation', name: 'Automation' },
];

// Icon component to render black SVG icons
function CategoryIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ReactElement> = {
    aerospace: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
      </svg>
    ),
    agency: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    ),
    agriculture: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.94 4.88A1.32 1.32 0 0021 4.5a1 1 0 00-1 1.28l.78 3.12a3.05 3.05 0 01-1.78 3.54A3.09 3.09 0 0116.5 13a3.42 3.42 0 01-1.72-1.12 3.52 3.52 0 01-.9-2.65l.78-3.12a1 1 0 00-1-1.28 1.32 1.32 0 00-.94.38l-3.31 3.35a9.33 9.33 0 00-2.67 6.58v3.86a1 1 0 002 0v-1.86l2.75 2.75a1.5 1.5 0 002.12 0l3.31-3.35a9.33 9.33 0 002.67-6.58l.78-3.12z"/>
      </svg>
    ),
    animals: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm13 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM9 8c0-.83.67-1.5 1.5-1.5S12 7.17 12 8s-.67 1.5-1.5 1.5S9 8.83 9 8zm4.5 1.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S12 7.17 12 8s.67 1.5 1.5 1.5zM12 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
    art: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
      </svg>
    ),
    audit: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
      </svg>
    ),
    automation: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
    automotive: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    ),
    beauty: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
      </svg>
    ),
  };
  
  return <span className="text-black">{iconMap[type] || iconMap.agriculture}</span>;
}

export function BrowseCategories() {
  const [activeTab, setActiveTab] = useState<'industry' | 'nameStyles'>('industry');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  
  const currentCategories = activeTab === 'industry' ? industryCategories : nameStyles;
  const displayedCategories = showMoreCategories ? currentCategories : currentCategories.slice(0, 6);

  return (
    <section className="w-full py-8 sm:py-12">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Popular Searched Keywords - Single Row */}
        <div className="mb-12">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-black mb-6">
            Popular searched keywords
          </h2>
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2">
            {popularKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                className="px-5 py-2.5 bg-[#9ca3af] text-white text-[12px] font-medium rounded-md hover:bg-[#6b7280] transition-colors whitespace-nowrap shrink-0"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Headers */}
        <div className="mb-8">
          <div className="flex gap-8 mb-6">
            <h2 
              onClick={() => { setActiveTab('industry'); setShowMoreCategories(false); }}
              className={`text-[28px] sm:text-[32px] font-bold cursor-pointer transition-colors ${
                activeTab === 'industry' ? 'text-black' : 'text-[#6b7280]'
              }`}
            >
              Browse By Industry Categories
            </h2>
            <h2 
              onClick={() => { setActiveTab('nameStyles'); setShowMoreCategories(false); }}
              className={`text-[28px] sm:text-[32px] font-bold cursor-pointer transition-colors ${
                activeTab === 'nameStyles' ? 'text-black' : 'text-[#6b7280]'
              }`}
            >
              Browse By Name Styles
            </h2>
            
          </div>
          
          {/* 3 Column Grid - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCategories.map((category) => (
              <button
                key={category.name}
                type="button"
                className="w-[340px] h-[64px] flex items-center gap-4 px-5 bg-[#e7e5e5] text-black text-[16px] font-medium rounded-2xl hover:bg-[#d1d5db] transition-colors text-left"
              >
                <CategoryIcon type={category.iconType} />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          
          {/* Show More Button */}
          {currentCategories.length > 6 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowMoreCategories(!showMoreCategories)}
                className="px-8 py-2.5 bg-white border-2 border-black text-black text-[15px] font-semibold rounded-md hover:bg-gray-50 transition-colors"
              >
                {showMoreCategories ? 'SHOW LESS' : 'SHOW MORE'}
              </button>
            </div>
          )}

          {/* Browse All Categories Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="px-8 py-3.5 bg-[#4c6ef5] text-white text-[16px] font-semibold rounded-lg hover:bg-[#4263eb] transition-colors"
            >
              BROWSE ALL CATEGORIES
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
