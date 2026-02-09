import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  getCart,
  removeFromCart,
  clearCart,
  updateCartItemQuantity,
  CART_UPDATED_EVENT,
  type CartItem,
} from '../../../services/cartService';

export function CartTab() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const { items, subtotal: st } = await getCart();
      setCartItems(items);
      setSubtotal(st);
    } catch (error) {
      console.error('Error loading cart:', error);
      setMessage('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart after auth is ready so we use the same cart user id as add-to-cart
  useEffect(() => {
    if (!authLoading) loadCart();
  }, [authLoading]);

  // Refetch cart from API when cart is updated elsewhere (e.g. add from homepage)
  useEffect(() => {
    const onCartUpdated = () => loadCart();
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, []);

  const handleRemove = async (itemId: string) => {
    try {
      const result = await removeFromCart(itemId);
      if (result.success) {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        const newSub = cartItems
          .filter((i) => i.id !== itemId)
          .reduce((s, i) => s + i.domainPrice * i.quantity, 0);
        setSubtotal(newSub);
        setMessage('Removed from cart');
      } else {
        setMessage(result.message || 'Failed to remove from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setMessage('Failed to remove from cart');
    }
  };

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    const qty = Math.max(1, Math.floor(newQty));
    const result = await updateCartItemQuantity(item.id, qty);
    if (result.success) {
      setCartItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i))
      );
      setSubtotal((prev) => prev - item.domainPrice * item.quantity + item.domainPrice * qty);
    }
  };

  const handleClearCart = async () => {
    try {
      const result = await clearCart();
      if (result.success) {
        setCartItems([]);
        setSubtotal(0);
        setMessage('Cart cleared');
      } else {
        setMessage(result.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setMessage('Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    navigate('/checkout');
  };

  const displaySubtotal = subtotal || cartItems.reduce((s, i) => s + i.domainPrice * i.quantity, 0);
  const processingFee = displaySubtotal * 0.03;
  const total = displaySubtotal + processingFee;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-[#2c3e50]">Shopping Cart</h2>
        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear Cart
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('success') ||
            message.includes('soon') ||
            message.includes('cleared') ||
            message.includes('Removed')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3898ec]"></div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12 text-[#6c7a89]">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-lg">Your cart is empty</p>
          <p className="text-sm mt-2">Browse domains and add to your cart</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#d3dce6] divide-y divide-[#d3dce6]">
            {cartItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 flex-wrap">
                {item.logoImage && (
                  <img
                    src={item.logoImage}
                    alt={item.domainName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2c3e50] text-lg">{item.domainName}</h3>
                  {item.addedAt && (
                    <p className="text-[#6c7a89] text-sm mt-1">
                      Added {item.addedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#6c7a89]">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item, Number(e.target.value))}
                    className="w-14 border border-[#d3dce6] rounded px-2 py-1 text-center"
                  />
                </div>
                <div className="text-right">
                  <p className="text-[#3898ec] font-bold text-lg">
                    ${(item.domainPrice * item.quantity).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-sm text-red-600 hover:text-red-800 mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg border border-[#d3dce6] p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[#6c7a89]">
                <span>
                  Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </span>
                <span>${displaySubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#6c7a89]">
                <span>Processing Fee (3%)</span>
                <span>${processingFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#d3dce6] pt-3 flex justify-between items-center">
                <span className="font-semibold text-[#2c3e50] text-lg">Total</span>
                <span className="font-bold text-[#2c3e50] text-2xl">${total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full mt-6 px-6 py-3 bg-[#3898ec] text-white rounded-lg font-semibold hover:bg-[#2d7bc4] transition-colors"
            >
              Proceed to Checkout
            </button>

            <p className="text-center text-[#6c7a89] text-sm mt-3">
              Secure checkout powered by Escrow.com
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartTab;
