export function BrandingStep3({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A] text-center mb-2">
        STEP 3 - Select a Package
      </h2>
      <p className="text-[16px] sm:text-[18px] text-[#555555] text-center mb-10 max-w-[800px] mx-auto leading-snug">
        Pick from our affordable packages, from Pink Tulip to Blue Tulip.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1000px] mx-auto">
        {['Pink Tulip', 'Red Tulip', 'Yellow Tulip', 'Blue Tulip'].map((pkg) => (
          <button
            key={pkg}
            type="button"
            className="bg-gray-100 rounded-xl p-6 text-center hover:bg-gray-200 hover:ring-2 hover:ring-brandip-accent transition-all"
          >
            <span className="font-bold text-[18px] text-[#1A1A1A]">{pkg}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#1A1A1A] font-semibold transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg bg-brandip-accent hover:opacity-90 text-white font-semibold transition-colors"
        >
          Next
        </button>
      </div>
    </>
  );
}
