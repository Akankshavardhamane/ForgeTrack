import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar, Users, Activity, Clock } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todaySession, setTodaySession] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
  const [overview, setOverview] = useState({ totalSessions: 0, avgAttendance: 0 });
  const [absentStudents, setAbsentStudents] = useState([]);
  
  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        
        if (userData && userData.display_name && mounted) {
          setUser(userData);
        } else if (mounted) {
          setUser({ display_name: session.user.email });
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', today)
        .single();
        
      if (!mounted) return;
      setTodaySession(sessionData);

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
      if (sessionData) {
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionData.id)
          .eq('present', true);
          
        const { data: absentData } = await supabase
          .from('attendance')
          .select('students(name)')
          .eq('session_id', sessionData.id)
          .eq('present', false)
          .limit(3);

        setAttendanceStats({
          present: presentCount || 0,
          total: studentCount || 0
        });
        
        if (absentData) {
          setAbsentStudents(absentData.map(a => a.students?.name).filter(Boolean));
        }
      } else {
        setAttendanceStats({ present: 0, total: studentCount || 0 });
        setAbsentStudents([]);
      }

      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
        
      setOverview({
        totalSessions: totalSessions || 0,
        avgAttendance: 82 
      });

      setLoading(false);
    };

    fetchDashboardData();
    return () => mounted = false;
  }, []);

  if (loading) {
    return <div className="text-secondary animate-pulse">Loading dashboard...</div>;
  }

  const attendancePercentage = attendanceStats.total ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;
  const firstName = user?.display_name ? user.display_name.split('@')[0].split(' ')[0] : 'Mentor';

  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {/* Hero Section */}
      <div>
        <h1 className="text-[48px] md:text-[64px] font-bold text-white tracking-tight leading-none mb-2">
          Welcome Back, <span className="capitalize">{firstName}</span>
        </h1>
        <p className="text-body text-secondary mt-4">
          Last login: Today at 09:41 AM
        </p>
      </div>

      {/* Stats Bar */}
      <div className="pt-4">
        <div className="flex flex-wrap gap-8 items-center text-label font-bold text-secondary mb-4 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>TOTAL SESSIONS <span className="text-white ml-2 text-h3">{overview.totalSessions}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={18} />
            <span>OVERALL ATTENDANCE % <span className="text-white ml-2 text-h3">{overview.avgAttendance}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>ACTIVE STUDENTS <span className="text-white ml-2 text-h3">{attendanceStats.total}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span>LAST SESSION DATE <span className="text-white ml-2 text-h3">Nov 04</span></span>
          </div>
        </div>
        
        {/* Progress Bar Separator */}
        <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden flex">
          <div className="h-full bg-white w-[25%] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          <div className="h-full bg-white/20 w-[75%]"></div>
        </div>
      </div>

      {/* Main Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Today's Session Card */}
        <div className="card bg-surface-inset border border-subtle p-8 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
            <Calendar size={320} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[260px]">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-secondary font-bold tracking-widest uppercase">TODAY'S SESSION</span>
                {todaySession && (
                  <span className="pill pill-present border border-success-fg/30 bg-success-fg/10 text-success-fg">
                    {todaySession.session_type === 'offline' ? 'Offline' : 'Online'}
                  </span>
                )}
              </div>
              <h2 className="text-[36px] font-bold text-white mb-6 leading-tight">
                {todaySession ? todaySession.topic : 'No Session Scheduled'}
              </h2>
            </div>
            
            <div>
              {todaySession ? (
                <div className="flex items-center gap-4 text-body-lg font-medium text-secondary mb-8">
                  <span>Date: {new Date(todaySession.date).toLocaleDateString()}</span>
                  <span className="w-1 h-1 rounded-full bg-secondary"></span>
                  <span>Duration: {todaySession.duration_hours || '2.0'}h</span>
                </div>
              ) : (
                <p className="text-secondary mb-8 text-body-lg">Take a break, or prepare materials for the next class.</p>
              )}
              
              <Link 
                to="/attendance" 
                className="inline-flex items-center justify-center bg-white text-void font-bold px-6 py-3 rounded-md hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Mark Attendance <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="card bg-surface-inset border border-subtle p-8 flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-label text-secondary font-bold tracking-widest uppercase">TODAY'S ATTENDANCE</span>
              <span className="pill pill-present border border-success-fg/30 bg-success-fg/10 text-success-fg">
                + {attendancePercentage}%
              </span>
            </div>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-[64px] font-bold text-white leading-none tracking-tighter">
                {attendanceStats.present}
              </span>
              <span className="text-[36px] font-bold text-secondary">
                / {attendanceStats.total}
              </span>
            </div>
          </div>

          <div>
            <span className="block text-label text-secondary font-bold tracking-widest uppercase mb-4">ABSENT STUDENTS</span>
            {absentStudents.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {absentStudents.map((name, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-[#3d1a1a] border border-[#ff4a4a]/40 text-[#ff7a7a] text-body-sm font-medium">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-success-fg text-body font-medium bg-success-bg/20 border border-success-fg/20 px-4 py-2 rounded-md inline-block">
                Everyone is present! 🎉
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
