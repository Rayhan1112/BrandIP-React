export function OffersTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">My Offers</h2>
      <div className="text-center py-12 text-[#6c7a89]">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-lg">No offers yet</p>
        <p className="text-sm mt-2">Offers on your domains will appear here</p>
      </div>
    </div>
  );
}

export default OffersTab;
