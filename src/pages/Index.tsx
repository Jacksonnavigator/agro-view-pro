// Index page - redirects to login or dashboard
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // Redirect based on auth status
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

export default Index;
