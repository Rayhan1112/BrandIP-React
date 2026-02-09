import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getCart,
  clearCart,
  notifyCartUpdated,
  createOrderInFirestore,
} from '../../services/cartService';

interface CartItem {
  id: string;
  domainId: string;
  domainName: string;
  domainPrice: number;
  logoImage: string;
  quantity: number;
}

interface BillingAddress {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  city: string;
  phone: string;
  address: string;
  state: string;
  zipCode: string;
}

const STEPS = [
  { id: 1, label: 'Billing Information' },
  { id: 2, label: 'Payment Method' },
  { id: 3, label: 'Review' },
] as const;

const PAYMENT_METHOD_LABEL = 'Money Transfer';

export function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    company: '',
    country: '',
    city: '',
    phone: '',
    address: '',
    state: '',
    zipCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cart = await getCart();
      setCartItems(cart.items);
      const sub = cart.items.reduce((sum, item) => sum + item.domainPrice * item.quantity, 0);
      setSubtotal(sub);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!billingAddress.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(billingAddress.email)) newErrors.email = 'Invalid email format';
    if (!billingAddress.firstName) newErrors.firstName = 'First name is required';
    if (!billingAddress.lastName) newErrors.lastName = 'Last name is required';
    if (!billingAddress.phone) newErrors.phone = 'Phone is required';
    if (!billingAddress.address) newErrors.address = 'Address is required';
    if (!billingAddress.city) newErrors.city = 'City is required';
    if (!billingAddress.state) newErrors.state = 'State is required';
    if (!billingAddress.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!billingAddress.country) newErrors.country = 'Country is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const processingFee = Math.round(subtotal * 0.03 * 100) / 100;
      const total = subtotal + processingFee;

      const result = await createOrderInFirestore(
        billingAddress,
        'Money Transfer',
        cartItems.map((item) => ({
          domainId: item.domainId,
          domainName: item.domainName,
          domainPrice: item.domainPrice,
          logoImage: item.logoImage,
          quantity: item.quantity,
        })),
        subtotal,
        processingFee,
        total
      );

      if (!result) {
        setError('Failed to create order. Please try again.');
        return;
      }

      setOrderNumber(result.orderNumber);
      await clearCart();
      notifyCartUpdated();
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[16rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c3e50]"></div>
      </div>
    );
  }

  if (orderNumber) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center box-border">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600">Your order number is: <span className="font-semibold text-[#2c3e50]">{orderNumber}</span></p>
          <p className="text-gray-500 mt-4">We'll send you an email confirmation shortly.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#2c3e50] text-white rounded-lg hover:bg-[#34495e] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center box-border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Add some items to your cart before checking out.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#2c3e50] text-white rounded-lg hover:bg-[#34495e] transition-colors"
        >
          Browse Domains
        </button>
      </div>
    );
  }

  const processingFee = Math.round(subtotal * 0.03 * 100) / 100;
  const total = subtotal + processingFee;

  const goNextStep = () => {
    if (currentStep === 1 && !validateForm()) return;
    setError('');
    if (currentStep < 3) setCurrentStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const goPrevStep = () => {
    setError('');
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as 1 | 2 | 3);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 box-border overflow-x-hidden">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-6 sm:mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-0 max-w-2xl">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm border-2 ${
                  currentStep > step.id
                    ? 'bg-green-600 border-green-600 text-white'
                    : currentStep === step.id
                      ? 'border-[#2c3e50] bg-[#2c3e50] text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {currentStep > step.id ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-w-0">
        {/* Left - Step content */}
        <div className="lg:col-span-2 min-w-0">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {/* Step 1: Billing Information */}
            {currentStep === 1 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={billingAddress.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={billingAddress.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={billingAddress.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                    <input
                      type="text"
                      name="company"
                      value={billingAddress.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={billingAddress.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={billingAddress.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province *</label>
                    <input
                      type="text"
                      name="state"
                      value={billingAddress.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={billingAddress.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <select
                      name="country"
                      value={billingAddress.country}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                    {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={billingAddress.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2c3e50] focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={goNextStep}
                    className="px-6 py-3 bg-[#2c3e50] text-white rounded-lg font-semibold hover:bg-[#34495e] transition-colors"
                  >
                    Next: Payment Method
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Payment Method (Money Transfer only) */}
            {currentStep === 2 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h2>
                <div className="p-4 border-2 border-[#2c3e50] rounded-lg bg-gray-50 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#2c3e50] flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{PAYMENT_METHOD_LABEL}</p>
                      <p className="text-sm text-gray-500 break-words">Transfer money directly to our bank account. Instructions will be sent after you place the order.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={goPrevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNextStep}
                    className="px-6 py-3 bg-[#2c3e50] text-white rounded-lg font-semibold hover:bg-[#34495e] transition-colors"
                  >
                    Next: Review
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Review your order</h2>

                <div className="space-y-6">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Billing address</h3>
                    <p className="text-gray-900 break-words">
                      {billingAddress.firstName} {billingAddress.lastName}
                      <br />
                      {billingAddress.email}
                      <br />
                      {billingAddress.address}
                      <br />
                      {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                      <br />
                      {billingAddress.country}
                      <br />
                      {billingAddress.phone}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="mt-2 text-sm text-[#2c3e50] hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment method</h3>
                    <p className="text-gray-900 font-medium">{PAYMENT_METHOD_LABEL}</p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="mt-2 text-sm text-[#2c3e50] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8">
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={goPrevStep}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-[#2c3e50] text-white rounded-lg font-semibold hover:bg-[#34495e] transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Placing Order...' : `Place Order - ${formatCurrency(total)}`}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="lg:col-span-1 min-w-0">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            <div className="mb-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.logoImage && (
                    <img
                      src={item.logoImage}
                      alt={item.domainName}
                      className="w-12 h-12 rounded object-cover bg-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.domainName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(item.domainPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Fee (3%)</span>
                <span>{formatCurrency(processingFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
