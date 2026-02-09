export function TerminationsTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">Terminations</h2>
      <div className="text-center py-12 text-[#6c7a89]">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <p className="text-lg">No terminations</p>
        <p className="text-sm mt-2">Terminated transactions will appear here</p>
      </div>
    </div>
  );
}

export default TerminationsTab;
