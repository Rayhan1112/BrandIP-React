import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceById, getOrderById, type InvoiceRecord, type OrderRecord } from '../../../services/cartService';

interface InvoiceItem {
  domainId: string;
  domainName: string;
  domainPrice: number;
  quantity: number;
  logoImage?: string;
}

function formatDate(d: Date | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function InvoiceView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // Get the order first
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          if (mounted) {
            setError('Order not found');
            setLoading(false);
          }
          return;
        }
        setOrder(orderData);

        // If no invoice, show message
        if (!orderData.invoiceId) {
          if (mounted) {
            setError('No invoice generated for this order yet.');
            setLoading(false);
          }
          return;
        }

        // Get the invoice
        const invoiceData = await getInvoiceById(orderData.invoiceId);
        if (invoiceData) {
          setInvoice(invoiceData);
        } else {
          if (mounted) {
            setError('Invoice not found');
          }
        }
      } catch (e) {
        if (mounted) {
          setError('Failed to load invoice');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brandip-heading border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
        <Link
          to="/profile/orders"
          className="inline-block px-4 py-2 bg-brandip-heading text-white rounded-lg hover:bg-opacity-90"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!invoice || !order) {
    return null;
  }

  const billing = order.billingAddress as {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    phone?: string;
  } | undefined;

  const customerName = billing
    ? `${billing.firstName || ''} ${billing.lastName || ''}`.trim()
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/profile/orders"
          className="text-brandip-accent hover:underline font-medium"
        >
          ← Back to Orders
        </Link>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-brandip-heading text-white rounded-lg hover:bg-opacity-90"
        >
          Print Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-brandip-heading px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">INVOICE</h1>
              <p className="text-white opacity-80 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right text-white">
              <p className="font-medium">Date Issued</p>
              <p className="opacity-80">{formatDate(invoice.issuedAt)}</p>
            </div>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-8">
          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</h3>
            <div className="text-gray-900">
              <p className="font-medium text-lg">{customerName}</p>
              <p className="mt-1">{billing?.email}</p>
              <p className="mt-1">{billing?.address}</p>
              <p className="mt-1">
                {[billing?.city, billing?.state, billing?.zipCode, billing?.country].filter(Boolean).join(', ')}
              </p>
              {billing?.phone && <p className="mt-1">{billing.phone}</p>}
            </div>
          </div>

          {/* Order Info */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Order Date</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Item</th>
                  <th className="text-right py-2 font-medium text-gray-500">Qty</th>
                  <th className="text-right py-2 font-medium text-gray-500">Price</th>
                  <th className="text-right py-2 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: InvoiceItem, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3">
                      <p className="font-medium">{item.domainName}</p>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.domainPrice)}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(item.domainPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.processingFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Processing Fee</span>
                  <span className="font-medium">{formatCurrency(invoice.processingFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-brandip-heading">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          {invoice.transactionCreated && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 font-medium">✓ Transaction Completed</p>
              <p className="text-sm text-green-600 mt-1">
                Payment has been processed and verified.
              </p>
            </div>
          )}
        </div>

        {/* Invoice Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Thank you for your business!
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceView;
