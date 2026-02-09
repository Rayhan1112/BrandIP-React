export function AddressTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">My Addresses</h2>
      <div className="text-center py-12 text-[#6c7a89]">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg">No addresses saved yet</p>
        <button className="mt-4 px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors">
          Add New Address
        </button>
      </div>
    </div>
  );
}

export default AddressTab;
