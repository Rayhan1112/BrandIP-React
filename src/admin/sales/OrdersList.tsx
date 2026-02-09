import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrdersForAdmin, type OrderRecord } from '../../services/cartService';

function formatDate(d: Date | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function customerName(order: OrderRecord): string {
  const billing = order.billingAddress as { firstName?: string; lastName?: string; email?: string } | undefined;
  if (!billing) return order.customerId || '—';
  const first = billing.firstName?.trim() ?? '';
  const last = billing.lastName?.trim() ?? '';
  if (first || last) return `${first} ${last}`.trim();
  return billing.email?.trim() || order.customerId || '—';
}

function customerEmail(order: OrderRecord): string {
  const billing = order.billingAddress as { email?: string } | undefined;
  return billing?.email?.trim() || order.customerId || '—';
}

function locationString(order: OrderRecord): string {
  const b = order.billingAddress as { address?: string; city?: string; state?: string; country?: string } | undefined;
  if (!b) return '—';
  const parts = [b.address, b.city, b.state, b.country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllOrdersForAdmin().then((list) => {
      if (mounted) {
        setOrders(list);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3898ec] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <span className="text-sm text-gray-500">{orders.length} orders</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-12 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const b = order.billingAddress as { email?: string } | undefined;
            const hasImages = !!(order.paymentProof1Url || order.paymentProof2Url);
            return (
              <button
                type="button"
                key={order.id}
                onClick={() => navigate(`/admin/sales/orders/${order.id}`)}
                className="w-full text-left bg-white rounded-lg border border-gray-200 hover:border-[#3898ec] hover:shadow-md transition-all p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* Column 1: Order ID, Date, Status */}
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                  <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                  <div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      order.paymentVerificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      order.paymentVerificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.paymentVerificationStatus ?? order.status}
                    </span>
                  </div>
                </div>

                {/* Column 2: Grand Total, Pay via, Channel */}
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                  <div className="text-sm text-gray-600">Pay via: {order.paymentMethod || '—'}</div>
                  <div className="text-sm text-gray-600">Channel: Web</div>
                </div>

                {/* Column 3: Customer, Email, Location, Images */}
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{customerName(order)}</div>
                  <div className="text-sm text-gray-600 truncate" title={customerEmail(order)}>{customerEmail(order)}</div>
                  <div className="text-sm text-gray-500 truncate" title={locationString(order)}>{locationString(order)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {hasImages ? (
                      <>
                        {order.paymentProof1Url && (
                          <img src={order.paymentProof1Url} alt="Proof 1" className="w-8 h-8 rounded object-cover border border-gray-200" />
                        )}
                        {order.paymentProof2Url && (
                          <img src={order.paymentProof2Url} alt="Proof 2" className="w-8 h-8 rounded object-cover border border-gray-200" />
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No images</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
