import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Domain } from '../../services/domainService';

interface LowStockDomain extends Domain {
  daysSinceAdded: number;
}

const THRESHOLD_DAYS = 30; // Domains added more than 30 days ago with no sales

export function StockThreshold() {
  const [lowStockDomains, setLowStockDomains] = useState<LowStockDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - THRESHOLD_DAYS);

    // Real-time listener for pending domains older than threshold
    const domainsQuery = query(
      collection(db!, 'domains'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(domainsQuery, (snapshot) => {
      const domains = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const daysSinceAdded = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: doc.id,
          domainName: data.domainName || doc.id,
          domainPrice: data.domainPrice || 0,
          status: data.status as 'Active' | 'Pending' | 'Sold',
          logoImage: data.logoImage || '',
          mockupImage: data.mockupImage,
          industryType: data.industryType,
          nameStyle: data.nameStyle,
          description: data.description,
          shortDescription: data.shortDescription,
          keywords: data.keywords,
          escrowFee: data.escrowFee,
          brokerageFee: data.brokerageFee,
          possibleUses: data.possibleUses,
          createdAt,
          userId: data.userId || '',
          userEmail: data.userEmail,
          userName: data.userName,
          daysSinceAdded,
        } as LowStockDomain;
      });

      // Filter domains older than threshold
      const filtered = domains.filter(d => d.daysSinceAdded > THRESHOLD_DAYS);
      
      // Sort by oldest first
      filtered.sort((a, b) => b.daysSinceAdded - a.daysSinceAdded);
      
      setLowStockDomains(filtered);
    });

    setLoading(false);

    return () => unsubscribe();
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
        <h2 className="text-lg font-semibold text-gray-800">Stock Threshold</h2>
        <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">
          {THRESHOLD_DAYS}+ days pending
        </span>
      </div>
      
      {lowStockDomains.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No domains exceed the threshold</p>
          <p className="text-sm text-gray-400">All pending domains are within {THRESHOLD_DAYS} days</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockDomains.slice(0, 5).map((domain) => (
            <div 
              key={domain.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
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
                  <p className="text-xs text-gray-500">{domain.industryType || 'No category'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(domain.domainPrice)}</p>
                <p className="text-xs text-red-500 font-medium">
                  {domain.daysSinceAdded} days old
                </p>
              </div>
            </div>
          ))}
          
          {lowStockDomains.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                +{lowStockDomains.length - 5} more domains
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
