import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/axiosClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await api.post('/auth/forgotpassword', { email });
      setSuccess(true);
    } catch(err) {
      console.error(err);
      // For security, often we show success anyway to prevent email enumeration,
      // but showing error adds context during development.
      setSuccess(true); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10 flex-shrink-0"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10 flex-shrink-0"></div>

      <div className="w-full max-w-md my-8">
        <div className="mb-6 hover:text-gray-900 transition-colors inline-block text-gray-500">
          <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-[15px]">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xl p-8 relative overflow-hidden animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-extrabold text-gray-900 mb-2 tracking-tight">Reset Password</h1>
            <p className="text-gray-500 text-sm">Enter your email and we'll send you instructions to reset your password.</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label-text">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="email" 
                    className="input-field pl-10" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !email} className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-bold text-[15px] shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 mt-4">
                {loading ? <span className="w-5 h-5 border-2 border-transparent border-t-white border-l-white rounded-full animate-spin"></span> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center animate-fade-in py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-2 tracking-tight">Check your email</h3>
              <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
                We've sent a password reset link to <br/><span className="font-bold text-gray-900">{email}</span>.
              </p>
              <button 
                onClick={() => { setSuccess(false); setEmail(''); }}
                className="w-full py-3.5 bg-gray-50 text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Try another email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
