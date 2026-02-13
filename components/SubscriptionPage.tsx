import React, { useState } from 'react';
import { Check, Star, Shield, Zap } from 'lucide-react';
import { SubscriptionPlan } from '../types';

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
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: ['Priority booking (skip the queue)', '5% discount on all services', 'Verified helper selection', 'Premium support'],
    isPopular: true
  },
  {
    id: 'elite',
    name: 'TrustServe Elite',
    priceMonthly: 24.99,
    priceYearly: 249.99,
    features: ['Instant helper assignment', '15% discount on all services', 'Dedicated account manager', 'Free cancellation anytime', 'Extended warranty on repairs']
  }
];

const SubscriptionPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="py-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Upgrade Your Home Care</h2>
        <p className="text-slate-600 mb-8">
          Join thousands of happy homeowners who save time and money with our membership plans.
        </p>
        
        <div className="inline-flex bg-white rounded-full p-1 border border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly <span className="text-xs ml-1 opacity-80">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-sm border p-8 flex flex-col ${
              plan.isPopular ? 'border-indigo-600 ring-2 ring-indigo-600 ring-opacity-10 shadow-xl scale-105 z-10' : 'border-slate-200'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                </span>
                <span className="ml-1 text-slate-500 font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-slate-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.isPopular 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                  : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {plan.priceMonthly === 0 ? 'Current Plan' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;
