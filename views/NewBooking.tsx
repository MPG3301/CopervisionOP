
import React, { useState } from 'react';
import { User, Product, Booking } from '../types';

interface NewBookingProps {
  user: User;
  products: Product[];
  onBookingSubmit: (booking: Booking) => void;
}

const NewBooking: React.FC<NewBookingProps> = ({ user, products, onBookingSubmit }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Select a product');

    setIsSubmitting(true);

    const selectedProduct = products.find(p => p.id === productId)!;

    // Create new booking object
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      product_id: productId,
      product_name: selectedProduct.product_name,
      quantity,
      status: 'waiting',
      points_earned: selectedProduct.points_per_unit * quantity,
      created_at: new Date().toISOString(),
      optometrist_name: user.full_name
    };

    // Simulate API delay
    setTimeout(() => {
      // Mock email sending log
      console.log(`Email notification sent to: vk_nalla@yahoo.com | Booking ID: ${newBooking.id}`);
      onBookingSubmit(newBooking);
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">New Order</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
            <input
              type="text"
              disabled
              value="CooperVision"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[#005696]">Select Product</label>
            <select
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005696]"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choose a product...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name} ({p.points_per_unit} pts/unit)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl text-xl font-bold text-slate-600"
              >-</button>
              <input
                type="number"
                value={quantity}
                readOnly
                className="flex-1 text-center font-bold text-xl py-2 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl text-xl font-bold text-slate-600"
              >+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bill Image (Optional)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image ? (
                <p className="text-xs font-bold text-emerald-600">{image.name}</p>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-[10px] text-slate-400 font-medium">Capture or Upload Bill</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-2">
          <button
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-900/20 transition-all ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#005696] hover:bg-blue-800'}`}
          >
            {isSubmitting ? 'Submitting Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
