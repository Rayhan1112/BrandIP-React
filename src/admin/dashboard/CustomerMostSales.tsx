import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { OrderRecord } from '../../services/cartService';

interface TopCustomer {
  userId: string;
  userName: string;
  userEmail: string;
  totalSpent: number;
  orderCount: number;
}

export function CustomerMostSales() {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        // Get all completed orders
        const ordersQuery = query(
          collection(db!, 'orders'),
          where('status', '==', 'completed')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderRecord[];
        
        // Aggregate sales by user
        const userSales: Record<string, { userName: string; userEmail: string; totalSpent: number; orderCount: number }> = {};
        
        orders.forEach(order => {
          const userId = order.customerId;
          const billing = order.billingAddress as { email?: string; firstName?: string; lastName?: string } | undefined;
          const billingEmail = (billing?.email as string) || '';
          const userName = billing?.firstName
            ? `${billing.firstName} ${billing.lastName || ''}`.trim()
            : 'Unknown';

          if (!userSales[userId]) {
            userSales[userId] = {
              userName,
              userEmail: billingEmail,
              totalSpent: 0,
              orderCount: 0,
            };
          }
          userSales[userId].totalSpent += order.total || 0;
          userSales[userId].orderCount += 1;
        });

        // Get user details from users collection
        const usersQuery = collection(db!, 'users');
        const usersSnapshot = await getDocs(usersQuery);
        const userDetails: Record<string, { displayName: string; email: string }> = {};
        
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          userDetails[doc.id] = {
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
          };
        });

        // Merge user details
        Object.keys(userSales).forEach(userId => {
          if (userDetails[userId]) {
            userSales[userId].userName = userDetails[userId].displayName;
            userSales[userId].userEmail = userDetails[userId].email;
          }
        });

        // Convert to array and sort by total spent
        const sorted = Object.entries(userSales)
          .map(([userId, data]) => ({
            userId,
            ...data,
          }))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);

        setTopCustomers(sorted);
      } catch (error) {
        console.error('Error fetching top customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCustomers();
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
        <h2 className="text-lg font-semibold text-gray-800">Customer with Most Sales</h2>
        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
          Top Buyers
        </span>
      </div>
      
      {topCustomers.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500">No customer data yet</p>
          <p className="text-sm text-gray-400">Top customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div 
              key={customer.userId} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' : 
                  index === 1 ? 'bg-gray-300 text-gray-700' : 
                  index === 2 ? 'bg-orange-300 text-white' : 
                  'bg-[#3898ec] text-white'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.userName}</p>
                  <p className="text-xs text-gray-500">{customer.userEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
