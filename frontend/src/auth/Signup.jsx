import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { useAuth } from './AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, oauthLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'valid' | 'invalid' | null
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email Validation
  useEffect(() => {
    if (!formData.email) {
      setEmailStatus(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const timeoutId = setTimeout(() => {
      setEmailStatus(emailRegex.test(formData.email) ? 'valid' : 'invalid');
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Password Strength Logic
  useEffect(() => {
    let strength = 0;
    const pwd = formData.password;
    if (pwd.length > 5) strength += 1;
    if (pwd.length > 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailStatus === 'invalid') return setError("Please enter a valid email address");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    if (passwordStrength < 2) return setError("Please choose a stronger password");

    setLoading(true);
    setError("");

    try {
      await signup(formData.name, formData.email, formData.password);
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    // Redirect to backend OAuth initiation route
    if (provider === 'Google') {
      window.location.href = 'http://localhost:5000/api/auth/google';
    } else {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const isFormValid = formData.name && emailStatus === 'valid' && formData.password && formData.password === formData.confirmPassword && passwordStrength >= 2;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10 flex-shrink-0"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10 flex-shrink-0"></div>

      <div className="w-full max-w-md my-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark mb-2">Join SkillVerse</h1>
          <p className="text-gray-500 cursor-default">Start learning and sharing your skills today.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xl p-8 relative overflow-hidden animate-slide-up">
          {error && (
            <div className="bg-red-50/80 border border-red-200 text-red-600 p-3 rounded-xl text-[13px] font-medium mb-6 flex items-start gap-2 shadow-sm">
              <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="text" 
                  name="name"
                  className="input-field pl-10" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="email" 
                  name="email"
                  className={`input-field pl-10 pr-10 transition-colors ${emailStatus === 'invalid' ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                />
                {emailStatus === 'valid' && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-fade-in" />}
                {emailStatus === 'invalid' && <XIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 animate-fade-in" />}
              </div>
              {emailStatus === 'invalid' && <p className="text-[11px] text-red-500 mt-1 pl-1">Please enter a valid email address.</p>}
            </div>

            <div>
              <label className="label-text flex items-center justify-between">
                <span>Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  className="input-field pl-10 pr-10" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                    <div className={`h-full transition-all duration-300 ${passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-red-400 w-1/4' : passwordStrength === 2 ? 'bg-yellow-400 w-2/4' : passwordStrength === 3 ? 'bg-blue-400 w-3/4' : 'bg-green-500 w-full') : 'w-0'}`}></div>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 text-right font-medium">
                    {passwordStrength === 1 && <span className="text-red-500">Weak</span>}
                    {passwordStrength === 2 && <span className="text-yellow-600">Fair</span>}
                    {passwordStrength === 3 && <span className="text-blue-500">Good</span>}
                    {passwordStrength >= 4 && <span className="text-green-500">Strong</span>}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label-text">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword"
                  className={`input-field pl-10 pr-10 transition-colors ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="••••••••" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1 pl-1">Passwords do not match.</p>
              )}
            </div>

            <button type="submit" disabled={loading || !isFormValid} className="w-full py-3.5 mt-2 bg-blue-600 text-white rounded-lg font-bold text-[15px] shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-transparent border-t-white border-l-white rounded-full animate-spin"></span> : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-sm text-text-muted">Or sign up with</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="mt-6">
            <button type="button" onClick={() => handleOAuth('Google')} disabled={loading} className="w-full py-3.5 bg-white border border-border text-gray-700 font-semibold rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-text-muted">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
