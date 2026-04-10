import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Debug logs
  console.log('ProtectedRoute Debug:', {
    loading,
    isAuthenticated,
    userRole: user?.role,
    allowedRoles,
    user: user
  });

  // ⏳ Still loading user
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated → redirect to login');
    return <Navigate to="/login" replace />;
  }

  // ADMIN OVERRIDE (FULL ACCESS)
  if (user?.role === 'admin') {
    console.log('Admin access granted');
    return children;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log(`Role ${user?.role} not allowed. Allowed:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  // Allowed user
  return children;
};

export default ProtectedRoute;