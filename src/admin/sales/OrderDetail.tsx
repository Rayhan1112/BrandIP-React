import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getOrderById, 
  createInvoiceForOrder, 
  cancelInvoice,
  updateOrderPaymentVerification,
  type OrderRecord 
} from '../../services/cartService';
import { updateTransactionStatus } from '../../services/paymentService';

function formatDate(d: Date | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
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

function domainNames(order: OrderRecord): string {
  return order.items.map((i) => i.domainName).filter(Boolean).join(', ') || '—';
}

// Invoice Popup Component
function InvoicePopup({ 
  order, 
  onClose, 
  onCreateInvoice 
}: { 
  order: OrderRecord; 
  onClose: () => void;
  onCreateInvoice: (createTransaction: boolean) => void;
}) {
  const [createTransaction, setCreateTransaction] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await onCreateInvoice(createTransaction);
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Invoice</h3>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order #</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium">{customerName(order)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={createTransaction}
              onChange={(e) => setCreateTransaction(e.target.checked)}
              className="w-5 h-5 text-[#3898ec] rounded focus:ring-[#3898ec]"
            />
            <div>
              <span className="font-medium text-gray-900">Create Transaction</span>
              <p className="text-sm text-gray-500">Mark the associated transaction as completed</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 px-4 py-2 bg-[#3898ec] text-white rounded-lg font-medium hover:bg-[#2d7bc4] transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    getOrderById(orderId).then((o) => {
      if (mounted) {
        setOrder(o);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    const o = await getOrderById(orderId);
    if (o) setOrder(o);
  };

  const handleApprove = async () => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await updateOrderPaymentVerification(order.id, 'approved', 'Payment approved', 'admin');
      setMessage({ type: 'success', text: 'Payment approved successfully!' });
      loadOrder();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to approve payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await updateOrderPaymentVerification(order.id, 'rejected', 'Payment rejected', 'admin');
      setMessage({ type: 'error', text: 'Payment rejected.' });
      loadOrder();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to reject payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (createTransaction: boolean) => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const result = await createInvoiceForOrder(order.id, createTransaction);
      if (result) {
        if (createTransaction && order.transactionId) {
          await updateTransactionStatus(order.transactionId, 'completed');
        }
        setMessage({ type: 'success', text: `Invoice ${result.invoiceNumber} created successfully!` });
        loadOrder();
        setShowInvoicePopup(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to create invoice.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to create invoice.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await updateOrderPaymentVerification(order.id, 'rejected', 'Order cancelled by admin', 'admin');
      setMessage({ type: 'error', text: 'Order cancelled.' });
      loadOrder();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to cancel order.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!order?.invoiceId) return;
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await cancelInvoice(order.invoiceId);
      setMessage({ type: 'error', text: 'Invoice cancelled.' });
      loadOrder();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to cancel invoice.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3898ec] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Order not found.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/sales/orders')}
          className="px-4 py-2 bg-[#3898ec] text-white rounded-lg font-medium hover:bg-[#2d7bc4]"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const billing = order.billingAddress as {
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    zipCode?: string;
  } | undefined;
  const locationStr = billing
    ? [billing.address, billing.city, billing.state, billing.country].filter(Boolean).join(', ') || '—'
    : '—';

  const isPending = order.paymentVerificationStatus !== 'approved';
  const canCreateInvoice = order.paymentVerificationStatus === 'approved' && !order.invoiceId;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/sales/orders')}
          className="text-sm text-[#3898ec] hover:underline font-medium"
        >
          ← Back to Orders
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isPending ? (
          <>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Approve Payment
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            {canCreateInvoice && (
              <button
                onClick={() => setShowInvoicePopup(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#3898ec] text-white rounded-lg font-medium hover:bg-[#2d7bc4] transition-colors disabled:opacity-50"
              >
                Create Invoice
              </button>
            )}
            {order.invoiceId && (
              <button
                onClick={handleCancelInvoice}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Cancel Invoice
              </button>
            )}
            <button
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Order ID, Date, Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Order ID</dt>
              <dd className="font-medium text-gray-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  order.paymentVerificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  order.paymentVerificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.paymentVerificationStatus ?? order.status}
                </span>
              </dd>
            </div>
            {order.invoiceNumber && (
              <div>
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium text-[#3898ec]">{order.invoiceNumber}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Column 2: Grand Total, Pay via, Channel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Grand Total</dt>
              <dd className="font-semibold text-gray-900">{formatCurrency(order.total)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pay via</dt>
              <dd className="text-gray-900">{order.paymentMethod || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Channel</dt>
              <dd className="text-gray-900">Web</dd>
            </div>
            <div>
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="text-gray-900">{formatCurrency(order.subtotal)}</dd>
            </div>
            {order.processingFee > 0 && (
              <div>
                <dt className="text-gray-500">Processing fee</dt>
                <dd className="text-gray-900">{formatCurrency(order.processingFee)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Column 3: Customer, Email, Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Customer</dt>
              <dd className="font-medium text-gray-900">{customerName(order)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900 break-all">{billing?.email || order.customerId || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd className="text-gray-900">{locationStr}</dd>
            </div>
            {billing?.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{billing.phone}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h3>
        <p className="text-gray-900">{domainNames(order)}</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.domainName} — {formatCurrency(item.domainPrice)} × {item.quantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment proof images */}
      {(order.paymentProof1Url || order.paymentProof2Url) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment proof images</h3>
          <div className="flex flex-wrap gap-4">
            {order.paymentProof1Url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Proof 1</p>
                <a href={order.paymentProof1Url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={order.paymentProof1Url} alt="Proof 1" className="w-40 h-28 object-cover rounded border border-gray-200 hover:ring-2 hover:ring-[#3898ec]" />
                </a>
              </div>
            )}
            {order.paymentProof2Url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Proof 2</p>
                <a href={order.paymentProof2Url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={order.paymentProof2Url} alt="Proof 2" className="w-40 h-28 object-cover rounded border border-gray-200 hover:ring-2 hover:ring-[#3898ec]" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Popup */}
      {showInvoicePopup && (
        <InvoicePopup
          order={order}
          onClose={() => setShowInvoicePopup(false)}
          onCreateInvoice={handleCreateInvoice}
        />
      )}
    </div>
  );
}
