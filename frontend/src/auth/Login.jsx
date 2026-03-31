import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Github, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, oauthLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email, password);
      if (user.onboardingComplete) {
        navigate("/");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    if (provider === 'Google') {
      window.location.href = 'http://localhost:5000/api/auth/google';
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark mb-2">SkillVerse</h1>
          <p className="text-text-muted cursor-default">Welcome back! Please enter your details.</p>
        </div>

        <div className="card backdrop-blur-xl bg-white/80 border border-border shadow-2xl p-8">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center animate-fade-in">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="email" 
                  className="input-field pl-10" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="input-field pl-10 pr-10" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-4 h-4 border border-border rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors select-none">Remember me</span>
                </label>

                <Link to="/forgot-password" className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">Forgot password?</Link>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || !password} className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-bold text-[15px] shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-transparent border-t-white border-l-white rounded-full animate-spin"></span> : 'Sign in to SkillVerse'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-sm text-text-muted">Or continue with</span>
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
            Don't have an account? <Link to="/signup" className="text-primary font-medium hover:text-primary-dark transition-colors">Sign up for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
