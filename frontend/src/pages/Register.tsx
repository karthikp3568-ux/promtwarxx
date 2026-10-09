import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AuthForm from '../components/auth/AuthForm';

export default function Register() {
  const { register, signInGuest, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      await register(email, pass, displayName);
      navigate('/', { replace: true });
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
      navigate('/', { replace: true });
    } catch {
      // Handled in AuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-16">
      <AuthForm
        mode="register"
        onSubmit={handleRegister}
        onGuestClick={handleGuest}
        loading={loading}
        error={error}
      />
      <div className="mt-6 text-center text-sm text-gray-300">
        Already have an account?{' '}
        <Link to="/login" onClick={clearError} className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
