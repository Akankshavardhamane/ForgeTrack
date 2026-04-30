import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = () => {
  // Pass the role down from RoleGuard
  const { role } = useOutletContext() || { role: 'mentor' };

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* The cosmic glow applied at top center of main content */}
        <div className="absolute top-0 left-0 right-0 h-[600px] w-full pointer-events-none" 
             style={{ backgroundImage: 'var(--glow-cosmic)' }}></div>
        
        <TopBar role={role} />
        
        <main className="flex-1 overflow-y-auto z-10 relative px-6 md:px-8 lg:px-12 py-8">
          <div className="max-w-[1440px] mx-auto">
            <Outlet context={{ role }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
