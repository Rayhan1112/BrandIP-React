import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllOrdersForAdmin, 
  getOrdersForAdmin, 
  updateOrderPaymentVerification,
  type OrderRecord 
} from '../../services/cartService';
import { getOfflinePaymentByOrderId, approveOfflinePayment, rejectOfflinePayment } from '../../services/paymentService';

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
  const [approvedOrders, setApprovedOrders] = useState<OrderRecord[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

  useEffect(() => {
    let mounted = true;
    loadOrders().then(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const loadOrders = async () => {
    const [all, pending] = await Promise.all([
      getAllOrdersForAdmin(),
      getOrdersForAdmin(),
    ]);
    
    if (typeof window !== 'undefined') {
      setApprovedOrders(all.filter(o => o.paymentVerificationStatus === 'approved'));
      setPendingOrders(pending.filter(o => o.paymentVerificationStatus !== 'approved'));
    }
  };

  const handleApprove = async (order: OrderRecord) => {
    const success = await approveOfflinePayment(order.paymentId || order.id, 'admin', 'Payment approved');
    if (success) {
      await updateOrderPaymentVerification(order.id, 'approved', 'Payment approved', 'admin');
      loadOrders();
    }
  };

  const handleReject = async (order: OrderRecord) => {
    const success = await rejectOfflinePayment(order.paymentId || order.id, 'admin', 'Payment rejected');
    if (success) {
      await updateOrderPaymentVerification(order.id, 'rejected', 'Payment rejected', 'admin');
      loadOrders();
    }
  };

  const orders = activeTab === 'approved' ? approvedOrders : pendingOrders;

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
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'approved' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({approvedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pending' 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Approval ({pendingOrders.length})
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-12 text-center text-gray-500">
          {activeTab === 'approved' 
            ? 'No approved orders yet. Orders will appear here after payment approval.' 
            : 'No pending orders for approval.'}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const b = order.billingAddress as { email?: string } | undefined;
            const hasImages = !!(order.paymentProof1Url || order.paymentProof2Url);
            const isPending = order.paymentVerificationStatus !== 'approved';

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-[#3898ec] hover:shadow-md transition-all p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/sales/orders/${order.id}`)}
                    className="flex-1 text-left grid grid-cols-1 md:grid-cols-3 gap-4"
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 md:flex-col md:w-40">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(order)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(order)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/admin/sales/orders/${order.id}`)}
                          className="px-4 py-2 bg-[#3898ec] text-white rounded-lg font-medium hover:bg-[#2d7bc4] transition-colors"
                        >
                          View Details
                        </button>
                        {order.invoiceNumber ? (
                          <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-center">
                            Invoice: {order.invoiceNumber}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
