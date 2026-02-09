import { useState } from 'react';
import { 
  OverviewDetails, 
  TodaysDetails, 
  StoreStats, 
  StockThreshold, 
  TopSellingProducts, 
  CustomerMostSales 
} from './dashboard';

export function AdminDashboard() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  return (
    <div className="space-y-6 w-full">
      {/* Welcome + Date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hi ! Brandip-admin</h1>
          <p className="text-gray-500 text-base mt-0.5">Quickly Review what's going on in your store</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Main Content - 70% Left, 30% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 70% */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Details */}
          <OverviewDetails />

          {/* Today's Sale */}
          <TodaysDetails />

          {/* Stock Threshold */}
          <StockThreshold />
        </div>

        {/* Right Column - 30% */}
        <div className="lg:col-span-4 space-y-6">
          {/* Store Stats (Analytical) */}
          <StoreStats />

          {/* Top Selling Products */}
          <TopSellingProducts />

          {/* Customer with Most Sales */}
          <CustomerMostSales />
        </div>
      </div>
    </div>
  );
}
