import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  UserCheck, 
  Calendar, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Sidebar = ({ role }) => {
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

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {role === 'mentor' && (
          <>
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
          </>
        )}

        {role === 'student' && (
          <>
            <div>
              <div className="text-label text-tertiary mb-3 px-4">MY TRACKER</div>
              <div className="space-y-1">
                <NavItem to="/me/attendance" icon={UserCheck} label="My Attendance" />
                <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
              </div>
            </div>
            <div>
              <div className="text-label text-tertiary mb-3 px-4">RESOURCES</div>
              <NavItem to="/me/materials" icon={BookOpen} label="Materials" />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-subtle space-y-1">
        {/* Placeholder for settings, not in spec but standard */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 h-[44px] w-full rounded-lg transition-colors text-body font-medium text-secondary hover:bg-surface hover:text-primary"
        >
          <LogOut size={20} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
