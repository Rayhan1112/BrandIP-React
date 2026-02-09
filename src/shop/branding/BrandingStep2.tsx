import { getBrandingTypeTitle } from './brandingConstants';

export function BrandingStep2({
  selectedType,
  onBack,
  onNext,
}: {
  selectedType: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A] text-center mb-2">
        STEP 2 - Brief About Your Brand
      </h2>
      <p className="text-[16px] sm:text-[18px] text-[#555555] text-center mb-10 max-w-[800px] mx-auto leading-snug">
        Tell us about your business, its purpose, and your target audience.
      </p>
      {selectedType && (
        <p className="text-center text-[16px] text-[#555555] mb-8">
          Selected: <span className="font-semibold text-[#1A1A1A]">{getBrandingTypeTitle(selectedType)}</span>
        </p>
      )}
      <div className="max-w-[600px] mx-auto bg-gray-100 rounded-xl p-6 sm:p-8 space-y-4">
        <label className="block">
          <span className="block text-[16px] font-semibold text-[#1A1A1A] mb-2">Business description</span>
          <textarea
            className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1A1A1A]"
            placeholder="Describe your business and brand goals..."
            rows={4}
          />
        </label>
        <label className="block">
          <span className="block text-[16px] font-semibold text-[#1A1A1A] mb-2">Target audience</span>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1A1A1A]"
            placeholder="Who is your target audience?"
          />
        </label>
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
