import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const RoleGuard = ({ allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for fallback session if no official session exists
      const fallbackSessionStr = localStorage.getItem('forge_student_session');
      const fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;

      if (!session && !fallbackSession) {
        if (mounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      setIsAuthenticated(true);

      if (session) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (mounted) {
          if (data && !error && data.role) {
            setRole(data.role);
          } else {
            setRole('mentor');
          }
          setLoading(false);
        }
      } else if (fallbackSession) {
        if (mounted) {
          setRole(fallbackSession.role || 'student');
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas app-main flex items-center justify-center">
        <div className="text-secondary animate-pulse">Loading Session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet context={{ role }} />;
};

export default RoleGuard;
