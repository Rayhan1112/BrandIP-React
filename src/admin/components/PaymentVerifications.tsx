import { useState, useEffect } from 'react';
import {
  getOrdersForAdmin,
  updateOrderPaymentVerification,
  updateOrderAdminFields,
  type OrderRecord,
  type PaymentVerificationStatus,
} from '../../services/cartService';
import { useAdminAuth } from '../AdminAuthContext';

function formatDate(d: Date | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function domainNames(order: OrderRecord): string {
  return order.items.map((i) => i.domainName).filter(Boolean).join(', ') || '—';
}

function customerName(order: OrderRecord): string {
  const billing = order.billingAddress as { firstName?: string; lastName?: string; email?: string } | undefined;
  if (!billing) return order.customerId || '—';
  const first = billing.firstName?.trim() ?? '';
  const last = billing.lastName?.trim() ?? '';
  if (first || last) return `${first} ${last}`.trim();
  return billing.email?.trim() || order.customerId || '—';
}

function StatusBadge({ status }: { status: PaymentVerificationStatus }) {
  const styles: Record<PaymentVerificationStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

interface EditAndImagesModalProps {
  order: OrderRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onSaveStatus: (order: OrderRecord, status: PaymentVerificationStatus, adminNotes?: string) => Promise<boolean>;
  isProcessing: boolean;
}

function EditAndImagesModal({
  order,
  onClose,
  onSaved,
  onSaveStatus,
  isProcessing,
}: EditAndImagesModalProps) {
  const [adminNotes, setAdminNotes] = useState(order?.adminNotes ?? '');
  const [status, setStatus] = useState<PaymentVerificationStatus>(order?.paymentVerificationStatus ?? 'pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAdminNotes(order?.adminNotes ?? '');
    setStatus(order?.paymentVerificationStatus ?? 'pending');
  }, [order]);

  if (!order) return null;

  const hasProof1 = !!order.paymentProof1Url;
  const hasProof2 = !!order.paymentProof2Url;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const ok = await onSaveStatus(order, status, adminNotes.trim() || undefined);
    if (ok) {
      onSaved();
      onClose();
    } else {
      setError('Failed to save.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit — Order {order.orderNumber}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Order info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Order info</h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Order #</dt>
              <dd className="font-medium text-gray-900">{order.orderNumber}</dd>
              <dt className="text-gray-500">Domain Name</dt>
              <dd className="text-gray-900">{domainNames(order)}</dd>
              <dt className="text-gray-500">Customer Name</dt>
              <dd className="text-gray-900">{customerName(order)}</dd>
              <dt className="text-gray-500">Type</dt>
              <dd className="text-gray-900">{order.paymentMethod || 'Money Transfer'}</dd>
              <dt className="text-gray-500">Installment Date</dt>
              <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
              <dt className="text-gray-500">Amount</dt>
              <dd className="text-gray-900">{formatCurrency(order.total)}</dd>
            </dl>
          </div>

          {/* Attached images */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Attached payment proof images</h4>
            <div className="flex flex-wrap gap-4">
              {hasProof1 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Proof 1</p>
                  <a
                    href={order.paymentProof1Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#3898ec]"
                  >
                    <img
                      src={order.paymentProof1Url}
                      alt="Payment proof 1"
                      className="w-40 h-28 object-cover"
                    />
                  </a>
                </div>
              ) : (
                <div className="w-40 h-28 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
              {hasProof2 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Proof 2</p>
                  <a
                    href={order.paymentProof2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#3898ec]"
                  >
                    <img
                      src={order.paymentProof2Url}
                      alt="Payment proof 2"
                      className="w-40 h-28 object-cover"
                    />
                  </a>
                </div>
              ) : (
                <div className="w-40 h-28 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Editable: notes + status dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
              placeholder="Notes for this order..."
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentVerificationStatus)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isProcessing}
              className="px-4 py-2 bg-[#3898ec] text-white rounded-lg font-medium hover:bg-[#2d7bc4] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentVerifications() {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<OrderRecord | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const list = await getOrdersForAdmin();
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSaveStatus = async (
    order: OrderRecord,
    status: PaymentVerificationStatus,
    adminNotes?: string
  ): Promise<boolean> => {
    setProcessingId(order.id);
    let ok: boolean;
    if (status === 'approved' || status === 'rejected') {
      ok = await updateOrderPaymentVerification(
        order.id,
        status,
        adminNotes ?? order.adminNotes,
        user?.email ?? undefined
      );
    } else {
      ok = await updateOrderAdminFields(order.id, {
        adminNotes: adminNotes ?? order.adminNotes ?? undefined,
        paymentVerificationStatus: 'pending',
      });
    }
    if (ok) {
      await loadOrders();
      setEditOrder((current) => (current?.id === order.id ? null : current));
    }
    setProcessingId(null);
    return ok;
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Offline payments</h2>
        <span className="text-sm text-gray-500">
          {orders.filter((o) => o.paymentVerificationStatus === 'pending').length} pending
        </span>
      </div>
      <p className="text-sm text-gray-600">
        Orders are from the same <code className="bg-gray-100 px-1 rounded">orders</code> collection. Edit notes, then approve or reject; status is saved on the document and shown to the customer everywhere.
      </p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-12 text-center text-gray-500">
          No offline payment orders found.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, index) => {
                  const isProcessing = processingId === order.id;
                  const status = order.paymentVerificationStatus ?? 'pending';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-48 truncate" title={domainNames(order)}>
                        {domainNames(order)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-40 truncate" title={customerName(order)}>
                        {customerName(order)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.paymentMethod || 'Money Transfer'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setEditOrder(order)}
                          className="text-sm text-[#3898ec] hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editOrder && (
        <EditAndImagesModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={loadOrders}
          onSaveStatus={handleSaveStatus}
          isProcessing={processingId === editOrder.id}
        />
      )}
    </div>
  );
}
