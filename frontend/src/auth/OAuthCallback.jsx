import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOAuthSession } = useAuth();

  useEffect(() => {
    const processOAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (token) {
        await setOAuthSession(token);
        navigate('/');
      } else {
        navigate('/login');
      }
    };
    
    processOAuth();
  }, [location, navigate, setOAuthSession]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600 font-medium">Authenticating your account securely...</p>
    </div>
  );
};

export default OAuthCallback;
