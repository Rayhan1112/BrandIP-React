export function BrandingStep4({ onBack }: { onBack: () => void }) {
  return (
    <>
      <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A] text-center mb-2">
        STEP 4 - Make Payment
      </h2>
      <p className="text-[16px] sm:text-[18px] text-[#555555] text-center mb-10 max-w-[800px] mx-auto leading-snug">
        Complete your transaction through a secure channel.
      </p>
      <div className="max-w-[500px] mx-auto bg-gray-100 rounded-xl p-8 text-center">
        <p className="text-[16px] text-[#555555] mb-6">Payment options will appear here.</p>
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg bg-brandip-accent hover:opacity-90 text-white font-semibold transition-colors"
        >
          Proceed to payment
        </button>
      </div>
      <div className="flex justify-center mt-10">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#1A1A1A] font-semibold transition-colors"
        >
          Back
        </button>
      </div>
    </>
  );
}
