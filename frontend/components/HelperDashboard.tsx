import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Calendar, Star, TrendingUp, Power, MapPin, Check, X } from 'lucide-react';
import { EarningsData, Booking, EarningRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToIncomingJobs, acceptBooking, fetchHelperEarnings } from '../services/bookingService';

const HelperDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [incomingJobs, setIncomingJobs] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (isOnline) {
      const unsubscribe = subscribeToIncomingJobs((data) => {
        setIncomingJobs(data);
      });
      return () => unsubscribe();
    } else {
      setIncomingJobs([]);
    }
  }, [isOnline]);

  useEffect(() => {
    const loadEarnings = async () => {
      if (user) {
        const data = await fetchHelperEarnings(user.uid);
        setEarnings(data);
        const total = data.reduce((sum, record) => sum + record.amount, 0);
        setTotalEarnings(total);
      }
    };
    loadEarnings();
    const interval = setInterval(loadEarnings, 10000); // Polling for earnings
    return () => clearInterval(interval);
  }, [user]);

  // Process earnings for the chart
  const chartData = earnings.length > 0
    ? earnings.slice(0, 7).map(e => ({
      day: new Date(e.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: e.amount
    }))
    : [
      { day: 'Mon', amount: 0 },
      { day: 'Tue', amount: 0 },
      { day: 'Wed', amount: 0 },
      { day: 'Thu', amount: 0 },
      { day: 'Fri', amount: 0 },
      { day: 'Sat', amount: 0 },
      { day: 'Sun', amount: 0 },
    ];

  const handleJobAction = async (id: string, action: 'accept' | 'reject') => {
    if (action === 'reject') {
      setIncomingJobs(prev => prev.filter(job => job.id !== id));
    } else if (action === 'accept' && user) {
      try {
        await acceptBooking(id, user.uid, user.displayName || user.email || 'Helper');
        alert("Job Accepted! Check 'My Jobs' for details.");
      } catch (error) {
        console.error("Error accepting job:", error);
        alert("Failed to accept job. It might have been taken.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live Status Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          <div>
            <h3 className="font-bold text-slate-900">Status: {isOnline ? 'Online' : 'Offline'}</h3>
            <p className="text-sm text-slate-500">{isOnline ? 'You are visible to customers nearby.' : 'Go online to receive job requests.'}</p>
          </div>
        </div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${isOnline ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
          <Power className="w-4 h-4" /> {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm">Today's Earnings</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalEarnings.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm">Trust Score</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">98%</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm">Rating</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">4.9</h3>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Performance</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} prefix="₹" />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Jobs & Map */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[300px] relative overflow-hidden flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 z-10 relative">Live Location</h3>
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center pt-8">
              {/* Mock Map Background */}
              <div className="w-full h-full opacity-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-ping absolute"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-20"></div>
              </div>
              <p className="absolute bottom-4 bg-white/90 px-3 py-1 rounded-full text-xs font-medium shadow-sm z-20">Sector 18, City Center</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Incoming Requests</h3>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{incomingJobs.length}</span>
            </div>

            {incomingJobs.length > 0 ? (
              <div className="space-y-4">
                {incomingJobs.map(job => (
                  <div key={job.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50 animate-fade-in">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{job.service}</h4>
                      <span className="font-bold text-emerald-600">₹{job.price}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 mb-3 gap-2">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJobAction(job.id, 'reject')}
                        className="flex-1 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                      <button
                        onClick={() => handleJobAction(job.id, 'accept')}
                        className="flex-1 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No new requests.</p>
                {isOnline && <p className="text-xs text-slate-400 mt-1 animate-pulse">Scanning for jobs...</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default HelperDashboard;
