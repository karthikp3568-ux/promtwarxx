import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import Check from './pages/Check';
import HistoryPage from './pages/History';
import SavedReport from './pages/SavedReport';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

// Dev-only: the dynamic import string is computed so Vite cannot
// statically analyze it and will NOT include it in the production bundle.
const DevComponents = import.meta.env.DEV
  ? lazy(() => import(/* @vite-ignore */ './pages/DevComponents'))
  : null;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Protected routes */}
            <Route
              path="/check/:feature"
              element={
                <ProtectedRoute>
                  <Check />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:id"
              element={
                <ProtectedRoute>
                  <SavedReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Dev gallery (excluded in production) */}
            {DevComponents && (
              <Route
                path="/dev/components"
                element={
                  <Suspense fallback={<div className="text-gray-400 p-8">Loading...</div>}>
                    <DevComponents />
                  </Suspense>
                }
              />
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
