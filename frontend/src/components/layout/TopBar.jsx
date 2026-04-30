import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const TopBar = ({ role }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        const { data } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        
        if (data && data.display_name) {
          setUser(data);
        } else {
          setUser({ display_name: session.user.email });
        }
      }
    };
    fetchUser();
    return () => mounted = false;
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview / Dashboard';
    if (path === '/attendance') return 'Activity / Mark Attendance';
    if (path === '/history') return 'Activity / Student History';
    if (path === '/materials' || path === '/me/materials') return 'Resources / Materials';
    if (path === '/upload') return 'Data / Upload CSV';
    if (path === '/me/attendance') return 'My Tracker / Attendance';
    if (path === '/me/upcoming') return 'My Tracker / Upcoming';
    return 'Overview';
  };

  return (
    <div className="h-20 flex items-center justify-between px-6 md:px-8 lg:px-12 z-20">
      <div className="text-body text-secondary">
        {getBreadcrumbs()}
      </div>

      <div className="flex items-center gap-4">
        <input 
          type="text" 
          placeholder="Search..." 
          className="input h-10 w-64 hidden md:block rounded-full bg-surface-inset border-subtle"
        />
        <div className="flex items-center gap-3 pl-4 border-l border-subtle">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-body-sm font-medium text-primary">
              {user?.display_name || 'Loading...'}
            </span>
            <span className="text-caption text-tertiary capitalize">{role}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-primary font-medium border border-subtle">
            {user?.display_name ? user.display_name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
