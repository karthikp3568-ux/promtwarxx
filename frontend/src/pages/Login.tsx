import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AuthForm from '../components/auth/AuthForm';

export default function Login() {
  const { signIn, signInGuest, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signIn(email, pass);
      navigate(from, { replace: true });
    } catch {
      // Handled in AuthProvider
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInGuest();
      navigate(from, { replace: true });
    } catch {
      // Handled in AuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-16">
      <AuthForm
        mode="login"
        onSubmit={handleLogin}
        onGuestClick={handleGuest}
        loading={loading}
        error={error}
      />
      <div className="mt-6 text-center text-sm text-gray-300 space-y-2">
        <div>
          Don't have an account?{' '}
          <Link to="/register" onClick={clearError} className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </div>
        <div>
          <Link to="/reset-password" onClick={clearError} className="text-gray-400 hover:text-gray-300">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
