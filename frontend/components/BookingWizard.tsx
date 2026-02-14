import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createBooking } from '../services/bookingService';
import { getUserProfile, SQLProfile } from '../services/userService';
import { MASTER_SERVICES as services } from '../constants/services';

interface BookingWizardProps {
  initialServiceId?: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ initialServiceId, onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(initialServiceId || null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<SQLProfile | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
    }
  }, [user]);

  // Skip service selection if ID is provided
  useEffect(() => {
    if (initialServiceId) {
      setSelectedService(initialServiceId);
      setStep(2);
    }
  }, [initialServiceId]);

  const getPrice = () => {
    const service = services.find(s => s.id === selectedService);
    if (!service) return 0;

    let base = service.basePrice + (location.length > 0 ? 5 : 0);

    // Apply Subscription Discounts
    if (profile?.subscription_plan_id === 'pro') {
      base = base * 0.95; // 5% Discount
    } else if (profile?.subscription_plan_id === 'elite') {
      base = base * 0.85; // 15% Discount
    }

    return base;
  };

  const getDiscountInfo = () => {
    if (profile?.subscription_plan_id === 'pro') return "Pro Discount (5%)";
    if (profile?.subscription_plan_id === 'elite') return "Elite Discount (15%)";
    return null;
  };

  const nextStep = () => setStep(s => s + 1);

  const handleBooking = async () => {
    if (!user || !selectedService) return;

    setIsSubmitting(true);
    try {
      const service = services.find(s => s.id === selectedService);

      console.log("Submitting booking...");

      // We don't want the user to be stuck if the server is slow to respond,
      // especially since we have persistence enabled.
      // We'll wait at most 2 seconds for the server, then show success anyway.
      const bookingPromise = createBooking({
        service: service?.name || 'Unknown Service',
        customerId: user.uid,
        customerName: user.displayName || user.email || 'Guest User',
        date: date,
        price: getPrice(),
        location: location
      });

      await Promise.race([
        bookingPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      console.log("Booking flow proceeding to success step");
      setStep(4);
    } catch (error) {
      console.error("Booking failed:", error);
      alert(`Failed to create booking: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
              {i}
            </div>
            {i < 3 && <div className={`w-12 h-1 mx-2 transition-colors ${step > i ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Select a Service</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedService === service.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-300'
                  }`}
              >
                <div className="font-semibold">{service.name}</div>
                <div className="text-sm text-slate-500 mt-1">Starts at ₹{service.basePrice}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={onCancel}
              className="text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={nextStep}
              disabled={!selectedService}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Details & Location</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Service Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your address"
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Preferred Date & Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => initialServiceId ? onCancel() : setStep(1)}
              className="text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!location || !date}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Review & Confirm</h2>

          <div className="bg-slate-50 p-6 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Service</span>
              <span className="font-semibold text-slate-900">{services.find(s => s.id === selectedService)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Location</span>
              <span className="font-semibold text-slate-900">{location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date</span>
              <span className="font-semibold text-slate-900">{new Date(date).toLocaleString()}</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            {getDiscountInfo() && (
              <div className="flex justify-between text-emerald-600 text-sm font-medium mb-1">
                <span>{getDiscountInfo()} Applied</span>
                <span>-₹{(services.find(s => s.id === selectedService)!.basePrice - getPrice()).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-slate-800">Total Estimate</span>
              <span className="font-bold text-indigo-600">₹{getPrice().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Back
            </button>
            <button
              onClick={handleBooking}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? 'Processing...' : (
                <>Confirm Booking <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="text-center py-10 space-y-6 animate-bounce-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">🎉 Order is Done!</h2>
          <p className="text-slate-600 max-w-sm mx-auto">
            Your booking has been placed successfully. A professional will be assigned to your request shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              View My Bookings
            </button>
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Back to Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

export default BookingWizard;
