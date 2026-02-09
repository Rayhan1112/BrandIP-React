import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getOrdersByCustomerId, type OrderRecord } from '../../../services/cartService';

function formatDate(d: Date): string {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function domainNames(order: OrderRecord): string {
  return order.items.map((i) => i.domainName).filter(Boolean).join(', ') || '—';
}

export function OrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      const list = await getOrdersByCustomerId(user.uid);
      if (!cancelled) setOrders(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const getStatusDisplay = (order: OrderRecord): string => {
    if (order.paymentProof1Url && order.paymentProof2Url) return 'Proof uploaded';
    return order.status === 'pending' ? 'Pending' : order.status;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brandip-heading border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-brandip-heading mb-6">Orders</h2>
      <p className="text-sm text-gray-500 mb-6">View your order history. Upload payment proof from the Payment tab.</p>

      {orders.length === 0 ? (
        <p className="text-gray-500 py-8">No orders yet. Place an order from the cart to see them here.</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-brandip-border">
                <th className="py-3 px-2 font-semibold text-brandip-heading">Order Id</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Domain Name</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Amount</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Type</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Status</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Created At</th>
                <th className="py-3 px-2 font-semibold text-brandip-heading">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-brandip-border hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="py-3 px-2 text-gray-700 max-w-50 truncate" title={domainNames(order)}>
                    {domainNames(order)}
                  </td>
                  <td className="py-3 px-2 text-gray-700">{formatCurrency(order.total)}</td>
                  <td className="py-3 px-2 text-gray-700">{order.paymentMethod || 'Money Transfer'}</td>
                  <td className="py-3 px-2">
                    <span
                      className={
                        order.paymentProof1Url && order.paymentProof2Url
                          ? 'text-green-600 font-medium'
                          : 'text-amber-600'
                      }
                    >
                      {getStatusDisplay(order)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-2">
                    <Link
                      to="/profile/payment"
                      className="text-brandip-accent hover:underline font-medium"
                    >
                      Upload proof
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersTab;
