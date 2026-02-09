import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  getOrdersByCustomerId,
  updateOrderPaymentProofs,
  type OrderRecord,
} from '../../../services/cartService';
import { uploadToCloudinary } from '../../../firebase/cloudinary';

const PAYMENT_PROOFS_FOLDER = 'payment-proofs';

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

interface UploadProofDialogProps {
  order: OrderRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadProofDialog({ order, onClose, onSuccess }: UploadProofDialogProps) {
  const [proof1File, setProof1File] = useState<File | null>(null);
  const [proof2File, setProof2File] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!proof1File || !proof2File) {
      setError('Please select both payment proof images.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const [url1, url2] = await Promise.all([
        uploadToCloudinary(proof1File, PAYMENT_PROOFS_FOLDER),
        uploadToCloudinary(proof2File, PAYMENT_PROOFS_FOLDER),
      ]);
      const ok = await updateOrderPaymentProofs(order.id, url1, url2);
      if (ok) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to save payment proofs.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Payment Proof</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Order ID</label>
              <p className="mt-1 text-gray-900 font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Domain Name(s)</label>
              <p className="mt-1 text-gray-900 font-medium wrap-break-word">{domainNames(order)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof 1 *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof1File(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brandip-accent file:text-white file:font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof 2 *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof2File(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brandip-accent file:text-white file:font-medium"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !proof1File || !proof2File}
                className="flex-1 px-4 py-2 bg-brandip-heading text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function PaymentTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOrder, setDialogOrder] = useState<OrderRecord | null>(null);

  const loadOrders = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const list = await getOrdersByCustomerId(user.uid);
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user?.uid]);

  const getStatusDisplay = (order: OrderRecord): string => {
    const verification = order.paymentVerificationStatus ?? 'pending';
    if (verification === 'approved') return 'Approved';
    if (verification === 'rejected') return 'Rejected';
    if (order.paymentProof1Url && order.paymentProof2Url) return 'Proof uploaded (pending review)';
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
      <h2 className="text-xl font-semibold text-brandip-heading mb-6">Payment</h2>
      <p className="text-sm text-gray-500 mb-6">View your orders and upload payment proof for money transfer.</p>

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
                        order.paymentVerificationStatus === 'approved'
                          ? 'text-green-600 font-medium'
                          : order.paymentVerificationStatus === 'rejected'
                            ? 'text-red-600 font-medium'
                            : order.paymentProof1Url && order.paymentProof2Url
                              ? 'text-amber-600 font-medium'
                              : 'text-gray-600'
                      }
                    >
                      {getStatusDisplay(order)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-2">
                    <button
                      type="button"
                      onClick={() => setDialogOrder(order)}
                      className="text-brandip-accent hover:underline font-medium"
                    >
                      Upload proof
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOrder && (
        <UploadProofDialog
          order={dialogOrder}
          onClose={() => setDialogOrder(null)}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}

export default PaymentTab;
