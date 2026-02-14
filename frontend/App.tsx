import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Menu, X, LayoutDashboard, Sparkles, Home as HomeIcon, LogOut, Calendar, Grid, Crown, MapPin, Bot } from 'lucide-react';
import ServiceNotifications from './components/ServiceNotifications';
import QualityAssurance from './components/QualityAssurance';
import HelperDashboard from './components/HelperDashboard';
import BookingWizard from './components/BookingWizard';
import Auth from './components/Auth';
import ServiceListing from './components/ServiceListing';
import CustomerBookings from './components/CustomerBookings';
import SubscriptionPage from './components/SubscriptionPage';
import { User, UserRole } from './types';

enum View {
  HOME = 'HOME',
  SERVICES = 'SERVICES',
  BOOKINGS = 'BOOKINGS',
  SUBSCRIPTION = 'SUBSCRIPTION',
  QUALITY = 'QUALITY',
  DASHBOARD = 'DASHBOARD',
  BOOKING_WIZARD = 'BOOKING_WIZARD'
}

import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(loggedInUser.role === UserRole.HELPER ? View.DASHBOARD : View.HOME);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setCurrentView(View.HOME);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const startBooking = (serviceId?: string) => {
    setPreSelectedServiceId(serviceId || null);
    setCurrentView(View.BOOKING_WIZARD);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Shared Quality View
    if (currentView === View.QUALITY) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button onClick={() => setCurrentView(user.role === UserRole.HELPER ? View.DASHBOARD : View.HOME)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 mb-2">
              &larr; Back
            </button>
            <h2 className="text-3xl font-bold text-slate-900">AI Quality Verification</h2>
          </div>
          <QualityAssurance />
        </div>
      );
    }

    if (user.role === UserRole.HELPER) {
      switch (currentView) {
        case View.DASHBOARD:
          return (
            <div>
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Partner Dashboard</h2>
                  <p className="text-slate-600">Welcome back, {user.displayName || 'Partner'}! Ready for today's jobs?</p>
                </div>
              </div>
              <HelperDashboard />
            </div>
          );
        default:
          return <HelperDashboard />;
      }
    }

    // Customer Views
    switch (currentView) {
      case View.HOME:
        return (
          <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="lg:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  12 Helpers nearby & available now
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Home Services, <br />
                  <span className="text-indigo-600">Reimagined with AI</span>
                </h1>
                <p className="text-lg text-slate-600">
                  Instant booking, verified helpers, and objective quality assurance powered by Gemini Vision.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setCurrentView(View.SERVICES)} className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Book a Service
                  </button>
                  <button onClick={() => setCurrentView(View.QUALITY)} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Try AI QA
                  </button>
                </div>
              </div>
              <div className="lg:w-1/2 w-full hidden lg:flex justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center group">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 mb-1">98%</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quality Score</div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center group">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 mb-1">100%</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Partners</div>
                  </div>

                  <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-xl border border-indigo-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Bot className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Live Platform Activity</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-4xl font-black text-white mb-1">2,480+</div>
                          <div className="text-sm font-medium text-indigo-200">Active Bookings Today</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white mb-1">12m</div>
                          <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Avg. Response Time</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setCurrentView(View.SERVICES)}>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Grid className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Explore Services</h3>
                <p className="text-slate-600">From cleaning to repairs, find the right professional for your needs.</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setCurrentView(View.BOOKINGS)}>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Track Bookings</h3>
                <p className="text-slate-600">Monitor status, view helper details, and manage your schedule effortlessly.</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setCurrentView(View.SUBSCRIPTION)}>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Get Premium</h3>
                <p className="text-slate-600">Unlock discounts and priority booking with our subscription plans.</p>
              </div>
            </div>
          </div>
        );
      case View.SERVICES:
        return <ServiceListing onBookService={startBooking} />;
      case View.BOOKINGS:
        return <CustomerBookings />;
      case View.SUBSCRIPTION:
        return <SubscriptionPage />;
      case View.BOOKING_WIZARD:
        return (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <button onClick={() => setCurrentView(View.SERVICES)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 mb-2">
                &larr; Back to Services
              </button>
              <h2 className="text-3xl font-bold text-slate-900">Complete Your Booking</h2>
            </div>
            <BookingWizard
              initialServiceId={preSelectedServiceId}
              onComplete={() => setCurrentView(View.BOOKINGS)}
              onCancel={() => setCurrentView(View.SERVICES)}
            />
          </div>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(user.role === UserRole.HELPER ? View.DASHBOARD : View.HOME)}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">TrustServe</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {user.role === UserRole.CUSTOMER ? (
                <>
                  <button
                    onClick={() => setCurrentView(View.HOME)}
                    className={`text-sm font-medium transition-colors ${currentView === View.HOME ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setCurrentView(View.SERVICES)}
                    className={`text-sm font-medium transition-colors ${currentView === View.SERVICES || currentView === View.BOOKING_WIZARD ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setCurrentView(View.BOOKINGS)}
                    className={`text-sm font-medium transition-colors ${currentView === View.BOOKINGS ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => setCurrentView(View.SUBSCRIPTION)}
                    className={`text-sm font-medium transition-colors ${currentView === View.SUBSCRIPTION ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Premium
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCurrentView(View.DASHBOARD)}
                  className={`text-sm font-medium transition-colors ${currentView === View.DASHBOARD ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Dashboard
                </button>
              )}

              <button
                onClick={() => setCurrentView(View.QUALITY)}
                className={`text-sm font-medium transition-colors ${currentView === View.QUALITY ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Quality Check
              </button>

              <div className="w-px h-6 bg-slate-200"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-semibold text-slate-900">{user.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                  {(user.displayName || 'U').charAt(0)}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 hover:text-slate-900">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-lg absolute w-full left-0 z-50">
            {user.role === UserRole.CUSTOMER ? (
              <>
                <button onClick={() => { setCurrentView(View.HOME); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">Home</button>
                <button onClick={() => { setCurrentView(View.SERVICES); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">Services</button>
                <button onClick={() => { setCurrentView(View.BOOKINGS); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">My Bookings</button>
                <button onClick={() => { setCurrentView(View.SUBSCRIPTION); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">Premium Plans</button>
              </>
            ) : (
              <button onClick={() => { setCurrentView(View.DASHBOARD); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">Dashboard</button>
            )}
            <button onClick={() => { setCurrentView(View.QUALITY); setMobileMenuOpen(false); }} className="block w-full text-left font-medium text-slate-600 p-2 hover:bg-slate-50 rounded">AI Quality Check</button>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <button onClick={handleLogout} className="block w-full text-left font-medium text-red-600 p-2 hover:bg-red-50 rounded flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; 2024 TrustServe AI. All rights reserved.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-800 cursor-pointer">Helper Guidelines</span>
          </div>
        </div>
      </footer>
      <ServiceNotifications />
    </div>
  );
};

export default App;
