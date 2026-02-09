// Shimmer loading component
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 ${className}`} />
  );
}

// Shimmer card for domain listings
export function ShimmerCard() {
  return (
    <div className="bg-white rounded-[8px] border border-[#d3dce6] overflow-hidden h-full flex flex-col">
      {/* Image shimmer */}
      <Shimmer className="w-full h-[140px] sm:h-[160px] lg:h-[180px]" />
      
      {/* Footer shimmer */}
      <div className="p-3 sm:p-4 border-t border-[#d3dce6] flex justify-between items-center">
        <div className="min-w-0 mr-3 flex-1">
          <Shimmer className="h-5 w-24 rounded" />
        </div>
        <Shimmer className="h-6 w-16 rounded" />
      </div>
    </div>
  );
}

// Shimmer grid for multiple cards
export function ShimmerGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

// Shimmer for domain details page
export function ShimmerDetails() {
  return (
    <div className="min-h-screen">
      {/* Hero shimmer */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8 sm:pb-12 text-center">
        <Shimmer className="h-10 w-64 mx-auto rounded" />
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left column shimmer */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery shimmer */}
            <section>
              <div className="flex gap-4">
                <Shimmer className="flex-1 aspect-[4/3] rounded-xl" />
                <div className="flex flex-col gap-2 w-20 shrink-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Shimmer key={i} className="w-full aspect-square rounded-lg" />
                  ))}
                </div>
              </div>
              <Shimmer className="h-4 w-full mt-3 rounded" />
              <div className="flex gap-1.5 mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="w-2 h-2 rounded-full" />
                ))}
              </div>
            </section>

            {/* About shimmer */}
            <section>
              <Shimmer className="h-6 w-32 mb-3 rounded" />
              <Shimmer className="h-4 w-full rounded" />
              <Shimmer className="h-4 w-full mt-2 rounded" />
              <Shimmer className="h-4 w-3/4 mt-2 rounded" />
            </section>

            {/* Possible uses shimmer */}
            <section>
              <Shimmer className="h-6 w-56 mb-3 rounded" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Shimmer key={i} className="h-5 w-full mt-2 rounded" />
              ))}
            </section>

            {/* Industries shimmer */}
            <section>
              <Shimmer className="h-6 w-24 mb-3 rounded" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Shimmer key={i} className="h-7 w-24 rounded-lg" />
                ))}
              </div>
            </section>

            {/* What's next shimmer */}
            <section>
              <Shimmer className="h-6 w-32 mb-3 rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Shimmer key={i} className="h-5 w-full mt-2 rounded" />
              ))}
            </section>
          </div>

          {/* Right column shimmer */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Title shimmer */}
              <Shimmer className="h-6 w-40 rounded" />
              <Shimmer className="h-7 w-32 rounded" />

              {/* Purchase options shimmer */}
              <div className="space-y-3">
                <Shimmer className="h-20 w-full rounded-lg" />
                <Shimmer className="h-20 w-full rounded-lg" />
              </div>

              {/* Form shimmer */}
              <Shimmer className="h-64 w-full rounded-xl" />

              {/* Buttons shimmer */}
              <div className="grid grid-cols-2 gap-3">
                <Shimmer className="h-12 w-full rounded-lg" />
                <Shimmer className="h-12 w-full rounded-lg" />
              </div>

              {/* What's included shimmer */}
              <Shimmer className="h-40 w-full rounded-xl" />

              {/* Need help shimmer */}
              <Shimmer className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
