import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { OrderRecord } from '../../services/cartService';
import type { Domain } from '../../services/domainService';

interface OverviewStats {
  totalSales: number;
  totalOrders: number;
  approvedOrders: number;
  pendingOrders: number;
  totalDomains: number;
  totalCustomers: number;
  activeDomains: number;
  pendingDomains: number;
  soldDomains: number;
  totalInvoices: number;
  totalTransactions: number;
}

export function OverviewDetails() {
  const [stats, setStats] = useState<OverviewStats>({
    totalSales: 0,
    totalOrders: 0,
    approvedOrders: 0,
    pendingOrders: 0,
    totalDomains: 0,
    totalCustomers: 0,
    activeDomains: 0,
    pendingDomains: 0,
    soldDomains: 0,
    totalInvoices: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for Orders
    const ordersQuery = query(collection(db!, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderRecord[];
      
      setStats(prev => ({
        ...prev,
        totalOrders: orders.length,
        approvedOrders: orders.filter(o => o.paymentVerificationStatus === 'approved').length,
        pendingOrders: orders.filter(o => o.paymentVerificationStatus !== 'approved').length,
        totalSales: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      }));
    });

    // Real-time listener for Domains
    const domainsQuery = query(collection(db!, 'domains'));
    const unsubscribeDomains = onSnapshot(domainsQuery, (snapshot) => {
      const domains = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Domain[];
      
      setStats(prev => ({
        ...prev,
        totalDomains: domains.length,
        activeDomains: domains.filter(d => d.status === 'Active').length,
        pendingDomains: domains.filter(d => d.status === 'Pending').length,
        soldDomains: domains.filter(d => d.status === 'Sold').length,
      }));
    });

    // Real-time listener for Users
    const usersQuery = query(collection(db!, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalCustomers: snapshot.docs.length,
      }));
    });

    // Real-time listener for Invoices
    const invoicesQuery = query(collection(db!, 'invoices'));
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalInvoices: snapshot.docs.length,
      }));
    });

    // Real-time listener for Transactions
    const transactionsQuery = query(collection(db!, 'transactions'));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalTransactions: snapshot.docs.length,
      }));
    });

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeDomains();
      unsubscribeUsers();
      unsubscribeInvoices();
      unsubscribeTransactions();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview Details</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
            </div>
          </div>
        </div>

        {/* Approved Orders */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-200 rounded-lg">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Approved Orders</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.approvedOrders)}</p>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-lg">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">Pending Orders</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.pendingOrders)}</p>
            </div>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-200 rounded-lg">
              <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-indigo-700 font-medium">Total Invoices</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalInvoices)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Total Domains */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-lg">
              <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Domains</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalDomains)}</p>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border border-rose-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-200 rounded-lg">
              <svg className="w-5 h-5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-rose-700 font-medium">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalTransactions)}</p>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-200 rounded-lg">
              <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Customers</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalCustomers)}</p>
            </div>
          </div>
        </div>

        {/* All Orders */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">All Orders</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalOrders)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Status Breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.activeDomains}</p>
          <p className="text-sm text-gray-600">Active Domains</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingDomains}</p>
          <p className="text-sm text-gray-600">Pending Domains</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.soldDomains}</p>
          <p className="text-sm text-gray-600">Sold Domains</p>
        </div>
      </div>
    </div>
  );
}
