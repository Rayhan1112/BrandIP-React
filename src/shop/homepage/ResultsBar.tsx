import { useState } from 'react';

const sortOptions = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Newest'];

interface ResultsBarProps {
  resultsCount: number;
}

export function ResultsBar({ resultsCount }: ResultsBarProps) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-[0.875rem] text-[#6c7a89]">
          Showing {resultsCount} result{resultsCount !== 1 ? 's' : ''} found
        </p>
        <div className="relative inline-block w-full sm:w-auto sm:min-w-[140px]">
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#f5f5f5] border border-[#d3dce6] rounded-[6px] text-base text-[#6c7a89] hover:border-[#c5d0de]"
          >
            <span>Sort By</span>
            <svg className="w-4 h-4 shrink-0 text-[#6c7a89]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sortOpen && (
            <ul className="absolute z-10 right-0 mt-1 w-full min-w-[200px] bg-white border border-[#d3dce6] rounded-[6px] shadow-lg py-1">
              {sortOptions.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-base text-[#6c7a89] hover:bg-gray-50"
                    onClick={() => setSortOpen(false)}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
