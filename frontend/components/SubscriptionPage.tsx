import React, { useState } from 'react';
import { Check, Star, Shield, Zap, Loader2, ArrowLeft, Camera, Ticket, Download } from 'lucide-react';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, SQLProfile } from '../services/userService';

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Basic',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['Access to all services', 'Standard booking speed', 'Basic customer support', 'Pay per service']
  },
  {
    id: 'pro',
    name: 'TrustServe Pro',
    priceMonthly: 299,
    priceYearly: 2999,
    features: ['Priority booking (skip the queue)', '5% discount on all services', 'Verified helper selection', 'Premium support'],
    isPopular: true
  },
  {
    id: 'elite',
    name: 'TrustServe Elite',
    priceMonthly: 799,
    priceYearly: 7999,
    features: ['Instant helper assignment', '15% discount on all services', 'Dedicated account manager', 'Free cancellation anytime', 'Extended warranty on repairs']
  }
];

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCheckout, setShowCheckout] = useState<string | null>(null);

  // New States for Payment Proof
  const [transactionId, setTransactionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{ ticketNumber: string, date: string } | null>(null);
  const [profile, setProfile] = useState<SQLProfile | null>(null);

  const fetchProfile = async () => {
    if (user) {
      const data = await getUserProfile(user.uid);
      setProfile(data);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, [user]);

  const currentPlanId = profile?.subscription_plan_id || 'free';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to upgrade your plan.' });
      return;
    }
    if (planId === currentPlanId) return;

    if (planId === 'free') {
      executeUpgrade('free');
    } else {
      setShowCheckout(planId);
      setTicketData(null);
      setTransactionId('');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const submitPaymentProof = async () => {
    if (!user || !showCheckout || !transactionId || !selectedFile) {
      setMessage({ type: 'error', text: 'Please provide all payment details and proof.' });
      return;
    }

    const plan = plans.find(p => p.id === showCheckout);
    if (!plan) return;

    setIsUpdating(showCheckout);
    setMessage(null);

    const formData = new FormData();
    formData.append('uid', user.uid);
    formData.append('planId', showCheckout);
    formData.append('planName', plan.name);
    formData.append('transactionId', transactionId);
    formData.append('amount', (billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly).toString());
    formData.append('proof', selectedFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/verify-payment`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setTicketData({ ticketNumber: data.ticketNumber, date: data.date });
        setMessage({ type: 'success', text: 'Payment verification submitted successfully! 🎉' });
        fetchProfile(); // Re-fetch SQL profile to show active plan
      } else {
        throw new Error(data.error || 'Failed to submit payment proof');
      }
    } catch (error) {
      console.error("Payment proof submission failed:", error);
      setMessage({ type: 'error', text: 'Failed to submit proof. Please try again.' });
    } finally {
      setIsUpdating(null);
    }
  };

  const executeUpgrade = async (planId: string) => {
    if (!user) return;
    setIsUpdating(planId);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/users/${user.uid}/upgrade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          status: planId === 'free' ? 'inactive' : 'active'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully upgraded to ${plans.find(p => p.id === planId)?.name}! 🎉` });
        setShowCheckout(null);
        fetchProfile(); // Re-fetch SQL profile
      } else {
        throw new Error('Failed to update subscription in database');
      }
    } catch (error) {
      console.error("Subscription update failed:", error);
      setMessage({ type: 'error', text: 'Failed to update subscription. Please try again.' });
    } finally {
      setIsUpdating(null);
    }
  };

  const selectedPlanDetails = plans.find(p => p.id === showCheckout);

  return (
    <div className="py-8 animate-fade-in relative">
      {/* Checkout Modal */}
      {showCheckout && selectedPlanDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

            {ticketData ? (
              // CONFIRMATION TICKET VIEW
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Payment Verified!</h3>
                  <p className="text-slate-500">Your {selectedPlanDetails.name} membership is now active.</p>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                  <div className="flex justify-between items-center mb-4">
                    <Ticket className="w-6 h-6 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Official Receipt</span>
                  </div>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-400">Transaction ID</span>
                      <span className="text-xs font-mono font-bold">{transactionId}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-400">Ticket Number</span>
                      <span className="text-xs font-bold text-indigo-600">{ticketData.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-400">Plan</span>
                      <span className="text-xs font-bold">{selectedPlanDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Date</span>
                      <span className="text-xs font-bold">{ticketData.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Finalize Upgrade
                </button>
              </div>
            ) : (
              // PAYMENT & PROOF UPLOAD VIEW
              <>
                <div className="bg-indigo-600 p-6 text-white text-center relative">
                  <button
                    onClick={() => setShowCheckout(null)}
                    className="absolute left-6 top-8 text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-80" />
                  <h3 className="text-xl font-bold">QR Payment</h3>
                  <p className="text-indigo-100 text-sm mt-1">Scan to upgrade to {selectedPlanDetails.name}</p>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Plan</span>
                      <span className="font-semibold text-slate-900">{selectedPlanDetails.name} ({billingCycle})</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>Amount Due</span>
                      <span className="text-xl text-indigo-600">₹{billingCycle === 'monthly' ? selectedPlanDetails.priceMonthly : selectedPlanDetails.priceYearly}</span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/assets/${billingCycle === 'monthly' ? selectedPlanDetails.priceMonthly : selectedPlanDetails.priceYearly}.png`}
                        alt="Payment QR Code"
                        className="w-44 h-auto rounded-lg mx-auto"
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center px-4">
                      Scan with any UPI app to pay ₹{billingCycle === 'monthly' ? selectedPlanDetails.priceMonthly : selectedPlanDetails.priceYearly}.
                    </p>
                  </div>

                  {/* Proof Upload Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transaction Details</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter UPI Transaction ID (Reference #)"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Screenshot (Proof)</label>
                      <div className="relative group">
                        {previewUrl ? (
                          <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-indigo-600 border-dashed">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <Check className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer group">
                            <Camera className="w-8 h-8 text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-slate-400 font-medium">Click to upload screenshot</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={submitPaymentProof}
                      disabled={isUpdating !== null || !transactionId || !selectedFile}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Generate Ticket'}
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-slate-400 pb-4">
                    <Shield className="w-3 h-3 inline mr-1" /> All payments are manually verified for security.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Upgrade Your Home Care</h2>
        <p className="text-lg text-slate-600 mb-8">
          Join thousands of happy homeowners who save time and money with our premium membership plans.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        <div className="inline-flex bg-white rounded-full p-1 border border-slate-200 shadow-sm transition-all hover:border-slate-300">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Yearly <span className="text-xs ml-1 opacity-80">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-3xl shadow-sm border p-10 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 ${plan.isPopular ? 'border-indigo-600 ring-4 ring-indigo-600 ring-opacity-10 shadow-indigo-100 z-10' : 'border-slate-200'}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8 text-center sm:text-left">
              <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4 font-medium uppercase tracking-tighter">Perfect for your needs</p>
              <div className="flex items-baseline justify-center sm:justify-start">
                <span className="text-5xl font-black text-slate-900">
                  ₹{billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                </span>
                <span className="ml-1 text-slate-400 font-bold uppercase text-xs">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="p-1 bg-indigo-50 rounded-full mr-3 flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-slate-600 text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isUpdating !== null || currentPlanId === plan.id}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 transform active:scale-95 ${currentPlanId === plan.id ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default shadow-none' : plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
            >
              {isUpdating === plan.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentPlanId === plan.id ? (
                <>
                  <Check className="w-6 h-6" />
                  Current Plan
                </>
              ) : plan.priceMonthly === 0 ? (
                'Downgrade to Basic'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Comparison Section */}
      <div className="max-w-4xl mx-auto mt-24 px-4 pb-16 text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-8">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2">Can I cancel anytime?</h4>
            <p className="text-sm text-slate-600">Yes, you can cancel your subscription at any time from your settings page. Your benefits will continue until the end of the billing period.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2">How do discounts work?</h4>
            <p className="text-sm text-slate-600">Discounts are automatically applied to the total estimate of any service you book. No promo codes needed!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
