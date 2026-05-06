import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  Calendar, 
  MessageSquare,
  LogOut 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Sidebar = ({ role }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted && role === 'student') {
        const { data } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        if (data) {
          setUser(data);
        }
      }
    };
    fetchUser();
    return () => mounted = false;
  }, [role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 h-[44px] rounded-lg transition-colors text-body font-medium ${
          isActive 
            ? 'bg-surface-raised text-primary shadow-sm border-l-2 border-accent-glow' 
            : 'text-secondary hover:bg-surface hover:text-primary'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.75} />
      {label}
    </NavLink>
  );

  return (
    <div className="w-[260px] h-full bg-canvas border-r border-subtle flex flex-col hidden md:flex">
      <div className="h-20 flex items-center px-6 border-b border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-raised rounded-lg flex items-center justify-center">
            🌌
          </div>
          <span className="text-h3 text-primary">ForgeTrack</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-8">
        {role === 'student' && (
          <div className="px-8 pb-4 border-b border-subtle">
            <p className="text-body-sm text-secondary">Welcome Back,</p>
            <p className="text-h4 text-white">{user?.display_name || 'Student'}</p>
            <p className="text-[10px] font-bold text-tertiary mt-1 tracking-widest uppercase">STUDENT</p>
          </div>
        )}

        {role === 'mentor' && (
          <div className="px-4 space-y-8">
            <div>
              <div className="text-label text-tertiary mb-3 px-4">OVERVIEW</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>
            <div>
              <div className="text-label text-tertiary mb-3 px-4">ACTIVITY</div>
              <div className="space-y-1">
                <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
                <NavItem to="/history" icon={Users} label="Student History" />
                <NavItem to="/materials" icon={BookOpen} label="Materials" />
              </div>
            </div>
            <div>
              <div className="text-label text-tertiary mb-3 px-4">DATA</div>
              <NavItem to="/upload" icon={Upload} label="Upload CSV" />
            </div>
          </div>
        )}

        {role === 'student' && (
          <div className="px-4 space-y-8">
            <div>
              <div className="text-label text-tertiary mb-3 px-4">OVERVIEW</div>
              <div className="space-y-1">
                <NavItem to="/me/attendance" icon={LayoutDashboard} label="My Dashboard" />
              </div>
            </div>
            <div>
              <div className="text-label text-tertiary mb-3 px-4">ACADEMIC</div>
              <div className="space-y-1">
                <NavItem to="/me/materials" icon={BookOpen} label="My Materials" />
                {/* Dummy link for UI match */}
                <NavItem to="/me/appeals" icon={MessageSquare} label="Attendance Appeals" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-subtle space-y-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 h-[44px] w-full rounded-lg transition-colors text-body font-medium text-secondary hover:bg-surface hover:text-primary"
        >
          <LogOut size={20} strokeWidth={1.75} />
          Logout
        </button>
        
        <div className="px-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success-fg animate-pulse"></div>
          <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">DB CONNECTED</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
