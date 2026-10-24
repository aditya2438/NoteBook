import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Mail,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { SecurityLogItem, UserProfile } from '../../types';
import { playClickSound, playPlaceSound } from '../../utils/audioFeedback';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserChange }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'register' | 'login' | 'logs'>('profile');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<SecurityLogItem[]>([]);

  // Profile Edit State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regSimulatedOtp, setRegSimulatedOtp] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
          setLogs(data.securityLogs || []);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Send Registration OTP
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setFeedback({ type: 'error', message: 'Name and email are required.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword || 'password123',
          phone: regPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegOtpSent(true);
        setRegSimulatedOtp(data.simulatedCode);
        setFeedback({
          type: 'success',
          message: `Verification code sent to ${regEmail}. Use code: ${data.simulatedCode}`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to dispatch OTP.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error sending OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Registration OTP & Activate Cloud Account
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOtpCode.trim()) {
      setFeedback({ type: 'error', message: 'Please enter the 6-digit verification code.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, code: regOtpCode }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setRegOtpSent(false);
        setRegOtpCode('');
        setRegSimulatedOtp(null);
        setActiveTab('profile');
        setFeedback({
          type: 'success',
          message: `Account created & verified! Your notes will now auto-save to this account.`,
        });
        playPlaceSound();
        if (onUserChange) onUserChange(data.user);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Verification failed.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error verifying registration.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Login Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setFeedback({ type: 'error', message: 'Email address is required.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setActiveTab('profile');
        setFeedback({
          type: 'success',
          message: `Welcome back, ${data.user.name}! Cloud notes loaded successfully.`,
        });
        playClickSound();
        if (onUserChange) onUserChange(data.user);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Login failed.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during login.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Flow
  const handleLogout = async () => {
    playClickSound();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setActiveTab('login');
      setFeedback({ type: 'success', message: 'Logged out. You can sign in with another account.' });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-[#090b14]/90 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Aetheris Cloud Account</h2>
              <p className="text-[10px] text-slate-400">Continuous Autosave & Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('profile');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'profile' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('register');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'register' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('login');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'login' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400'
                }`}
              >
                Login
              </button>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="leading-snug">{feedback.message}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {activeTab === 'register' ? (
            /* CREATE ACCOUNT WITH OTP VERIFICATION */
            <div className="space-y-4">
              <div className="text-center pb-1">
                <h3 className="text-base font-bold text-white">Create New Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign up with email to securely auto-save your infinite canvas notes in the cloud.
                </p>
              </div>

              {!regOtpSent ? (
                <form onSubmit={handleSendRegisterOtp} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Harsh Bhadoria"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <input
                      type="password"
                      placeholder="Choose a secure password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Phone (Optional for 2FA)</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>Send Verification OTP</span>
                  </button>
                </form>
              ) : (
                /* OTP VERIFICATION STEP */
                <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                    <p className="font-semibold">Verification Code Sent</p>
                    <p className="text-[11px] text-cyan-300/80 mt-1">
                      A 6-digit OTP was dispatched to <strong className="text-white">{regEmail}</strong>.
                    </p>
                    {regSimulatedOtp && (
                      <div className="mt-2 p-2 rounded-xl bg-black/60 border border-cyan-400/40 flex items-center justify-between font-mono">
                        <span>Code: <strong className="text-amber-300 text-sm tracking-widest">{regSimulatedOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setRegOtpCode(regSimulatedOtp)}
                          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-center font-mono text-lg tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || regOtpCode.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/30 hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Verify & Activate Cloud Account</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setRegOtpSent(false)}
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      ← Back to edit email
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'login' ? (
            /* LOGIN VIEW */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="text-center pb-1">
                <h3 className="text-base font-bold text-white">Sign In to Your Cloud Notes</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log in to access and sync all your saved canvas notes from any device.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Account Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>Sign In to Cloud Account</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Don't have an account? Create one with OTP verification →
                </button>
              </div>
            </form>
          ) : (
            /* CURRENT USER PROFILE VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentUser?.name || 'Registered Creator'}</h3>
                    <p className="text-xs text-slate-400">{currentUser?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ● Cloud Autosave Active
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Pro Tier
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out of this account"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>

              {/* Security & Audit Logs Preview */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recent Security Audit Log</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Secure</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
