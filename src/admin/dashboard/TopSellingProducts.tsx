import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { OrderRecord, OrderItem } from '../../services/cartService';

interface TopSellingDomain {
  domainId: string;
  domainName: string;
  logoImage: string;
  totalSales: number;
  quantity: number;
}

export function TopSellingProducts() {
  const [topSelling, setTopSelling] = useState<TopSellingDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSelling = async () => {
      try {
        // Get all completed orders
        const ordersQuery = query(
          collection(db!, 'orders'),
          where('status', '==', 'completed')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderRecord[];
        
        // Aggregate sales by domain
        const domainSales: Record<string, { domainName: string; logoImage: string; totalSales: number; quantity: number }> = {};
        
        orders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: OrderItem) => {
              if (!domainSales[item.domainId]) {
                domainSales[item.domainId] = {
                  domainName: item.domainName,
                  logoImage: item.logoImage || '',
                  totalSales: 0,
                  quantity: 0,
                };
              }
              // Assume quantity is 1 for domains
              domainSales[item.domainId].totalSales += item.domainPrice;
              domainSales[item.domainId].quantity += 1;
            });
          }
        });

        // Convert to array and sort by total sales
        const sorted = Object.entries(domainSales)
          .map(([domainId, data]) => ({
            domainId,
            ...data,
          }))
          .sort((a, b) => b.totalSales - a.totalSales)
          .slice(0, 5);

        setTopSelling(sorted);
      } catch (error) {
        console.error('Error fetching top selling products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSelling();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Selling Products</h2>
        <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">
          By Revenue
        </span>
      </div>
      
      {topSelling.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500">No sales data yet</p>
          <p className="text-sm text-gray-400">Top selling domains will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topSelling.map((domain, index) => (
            <div 
              key={domain.domainId} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3898ec] text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                {domain.logoImage ? (
                  <img 
                    src={domain.logoImage} 
                    alt={domain.domainName}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#d3dce6] rounded flex items-center justify-center">
                    <span className="text-xs text-[#6c7a89]">N/A</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{domain.domainName}</p>
                  <p className="text-xs text-gray-500">{domain.quantity} sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{formatCurrency(domain.totalSales)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
