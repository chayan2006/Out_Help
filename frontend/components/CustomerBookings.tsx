import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, CheckCircle, CircleDashed, XCircle, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCustomerBookings } from '../services/bookingService';
import LiveTrackMap from './LiveTrackMap';

const CustomerBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'History'>('Active');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      setError(null);
      const unsubscribe = subscribeToCustomerBookings(
        user.uid,
        (data) => {
          setBookings(data);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setError("Failed to load bookings. Please try again later. If this is your first booking, it might take a moment.");
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  const filteredBookings = bookings.filter(b => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['Pending', 'Confirmed'].includes(b.status);
    if (filter === 'History') return ['Completed', 'Cancelled'].includes(b.status);
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      default: return <CircleDashed className="w-4 h-4" />;
    }
  };

  const handleTrack = (bookingId: string) => {
    setTrackingBookingId(bookingId);
  };

  const activeTrackingBooking = bookings.find(b => b.id === trackingBookingId);

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="text-lg font-bold mb-1">Something went wrong</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in relative px-4 sm:px-6 py-8">
      {/* Tracking Modal */}
      {trackingBookingId && activeTrackingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl relative shadow-2xl animate-fade-in overflow-hidden">
            <button
              onClick={() => setTrackingBookingId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full shadow-md text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Live Provider Tracking</h2>
              <LiveTrackMap
                customerLocation={{ lat: 28.6139, lng: 77.2090, address: activeTrackingBooking.location }} // New Delhi center
                providerLocation={{ lat: 28.6239, lng: 77.2190 }} // Slightly offset
                providerName={activeTrackingBooking.helperName || 'Assigned Helper'}
                serviceName={activeTrackingBooking.service}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">Manage your service requests and track helpers</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {['All', 'Active', 'History'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {loading ? (
          // Loading Skeleton
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
              <div className="h-20 bg-slate-100 rounded mt-4"></div>
            </div>
          ))
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No bookings found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-6">You don't have any bookings in this category yet.</p>
            {/* Note: In a real app, this button should trigger navigation to Services */}
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <Plus className="w-5 h-5" /> Book a Service
            </button>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{booking.service}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">ID: {booking.id}</span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">₹{booking.price}</div>
                  <div className="text-sm text-slate-500">Estimated Total</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Date & Time</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{new Date(booking.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Location</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1 truncate max-w-[200px]" title={booking.location}>{booking.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Helper</p>
                    {booking.helperName ? (
                      <p className="text-sm font-semibold text-slate-900 mt-1">{booking.helperName}</p>
                    ) : (
                      <p className="text-sm font-medium text-slate-400 italic mt-1">Assigning...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-4">
                {['Pending', 'Confirmed'].includes(booking.status) && (
                  <button
                    onClick={() => handleTrack(booking.id)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> Track Provider
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerBookings;
