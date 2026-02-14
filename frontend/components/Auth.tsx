import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User } from '../types';
import { ShieldCheck, User as UserIcon, Wrench, Mail, Phone, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import { syncUserWithBackend } from '../services/userService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, verifyPhone, sendVerificationEmail, logout, user: firebaseUser } = useAuth();

  const [role, setRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('userRole');
    return (savedRole as UserRole) || UserRole.CUSTOMER;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone'>('login');

  useEffect(() => {
    localStorage.setItem('userRole', role);
  }, [role]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Sync Firebase User with App State
  useEffect(() => {
    if (firebaseUser) {
      // Check if email is verified (skip for phone auth)
      if (firebaseUser.email && !firebaseUser.emailVerified && !firebaseUser.phoneNumber) {
        setNeedsVerification(true);
        return;
      }

      const appUser: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
        email: firebaseUser.email || (phoneNumber || ''),
        role: role,
        photoURL: firebaseUser.photoURL
      };
      onLogin(appUser);
      // Sync with SQL backend
      syncUserWithBackend({
        uid: appUser.uid,
        email: appUser.email,
        displayName: appUser.displayName,
        role: appUser.role
      });
    } else {
      setNeedsVerification(false);
    }
  }, [firebaseUser, onLogin, role, phoneNumber]);

  // Cleanup Recaptcha on unmount or mode switch
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      setVerificationSent(false);
    };
  }, [authMode]);

  // Initialize Recaptcha (omitted for brevity, unchanged)
  useEffect(() => {
    const initRecaptcha = async () => {
      if (authMode === 'phone' && !recaptchaVerifierRef.current && document.getElementById('recaptcha-container-placeholder')) {
        try {
          console.log("Initializing Recaptcha...");
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
          }

          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-placeholder', {
            'size': 'invisible',
            'callback': () => {
              console.log("Recaptcha solved");
            },
            'expired-callback': () => {
              console.log("Recaptcha expired");
            }
          });

          await verifier.render();
          recaptchaVerifierRef.current = verifier;
          console.log("Recaptcha initialized successfully");
        } catch (e) {
          console.error("Recaptcha init error:", e);
        }
      }
    };
    const timer = setTimeout(initRecaptcha, 100);
    return () => clearTimeout(timer);
  }, [authMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        await sendVerificationEmail();
        setVerificationSent(true);
        // Do not setLoading(false) here, let the useEffect handle the transition to needsVerification
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(mapAuthError(err));
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      setError("Verification email sent!");
    } catch (err: any) {
      console.error("Error sending verification:", err);
      // Handle rate limiting specifically
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please check your inbox or try again later.");
      } else {
        setError("Failed to send verification email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(mapAuthError(err));
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!verificationId) {
      try {
        if (!recaptchaVerifierRef.current) {
          throw new Error("Recaptcha not initialized. Please try refreshing the page.");
        }

        const confirmation = await verifyPhone(phoneNumber, recaptchaVerifierRef.current);
        setVerificationId(confirmation);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(mapAuthError(err));
        setLoading(false);
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) { console.error(e); }
          recaptchaVerifierRef.current = null;
        }
      }
    } else {
      try {
        await verificationId.confirm(otp);
      } catch (err: any) {
        console.error(err);
        setError("Invalid OTP code. Please try again.");
        setLoading(false);
      }
    }
  };

  const mapAuthError = (err: any) => {
    console.log("Auth Error Object:", err);
    const code = err?.code || 'unknown';
    const message = err?.message || 'Unknown error occurred';

    console.log("Auth Error Code:", code);

    if (code === 'auth/invalid-email') return 'Invalid email address.';
    if (code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (code === 'auth/user-disabled') return 'This user has been disabled.';
    if (code === 'auth/user-not-found') return 'No user found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/email-already-in-use') return 'Email is already active.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
    if (code === 'auth/invalid-verification-code') return 'Invalid OTP code.';
    if (code === 'auth/invalid-phone-number') return 'Invalid phone number format.';
    if (code === 'auth/popup-closed-by-user') return 'Sign in was cancelled.';
    if (code === 'auth/quota-exceeded') return 'SMS quota exceeded. Try again later.';
    if (code === 'auth/too-many-requests') return 'Too many requests. Try again later.';
    if (code === 'auth/billing-not-enabled') return 'Billing not enabled in Firebase Console.';

    return `Error: ${code} \n ${message}`;
  };

  // Verification Screen
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
          <p className="text-slate-600 mb-6">
            We've sent a verification email to <span className="font-semibold text-slate-900">{firebaseUser?.email}</span>.
            <br />Please verify your email to continue.
          </p>

          {verificationSent && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Email sent! Check your inbox.
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              I've Verified, Refresh Page
            </button>
            <button
              onClick={() => logout()}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">TrustServe AI</h1>
        <p className="text-slate-500 mt-2">Secure Home Services Platform</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Role Selection */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setRole(UserRole.CUSTOMER)}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${role === UserRole.CUSTOMER
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            <UserIcon className="w-4 h-4" /> Customer
          </button>
          <button
            onClick={() => setRole(UserRole.HELPER)}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${role === UserRole.HELPER
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            <Wrench className="w-4 h-4" /> Partner
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Auth Method Tabs - Only show if not in phone mode */}
          {authMode !== 'phone' && (
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setAuthMode('login'); setError(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${authMode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >Login</button>
              <button
                onClick={() => { setAuthMode('signup'); setError(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${authMode === 'signup' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >Sign Up</button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0"></span>
              {error}
            </div>
          )}

          {authMode === 'phone' ? (
            <form onSubmit={handlePhoneAuth} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Phone Verification</h3>
                <button type="button" onClick={() => setAuthMode('login')} className="text-sm text-slate-500 hover:text-slate-700">Back</button>
              </div>
              {!verificationId ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div id="recaptcha-container-placeholder"></div>
                  <p className="text-xs text-slate-500">We'll send you a verification code via SMS.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Enter OTP</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">Sent to {phoneNumber}</span>
                    <button type="button" onClick={() => setVerificationId(null)} className="text-indigo-600 hover:text-indigo-800">Change</button>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center transform active:scale-[0.98] transition-transform"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {verificationId ? 'Verify Code' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center transform active:scale-[0.98] transition-transform"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          )}

          {authMode !== 'phone' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  type="button"
                  className="w-full py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 transform active:scale-[0.98] transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
                <button
                  onClick={() => { setAuthMode('phone'); setError(null); }}
                  type="button"
                  className="w-full py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 transform active:scale-[0.98] transition-transform"
                >
                  <Smartphone className="w-5 h-5 text-slate-500" />
                  Sign in with Phone
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;
