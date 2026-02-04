import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Gallery from './pages/Gallery';
import Stats from './pages/Stats';
import Wishlist from './pages/Wishlist';
import Alerts from './pages/Alerts';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected route wrapper - allows access in demo mode
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDemoMode } = useDemo();

  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-ig-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-ig-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-ig-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  // Allow access if authenticated OR in demo mode
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Gallery />} />
        <Route path="stats" element={<Stats />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DemoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
