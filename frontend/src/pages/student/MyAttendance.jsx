import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, TrendingUp, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CircularProgress = ({ percentage }) => {
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#ffffff"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute text-[32px] font-bold text-white">
        {percentage}%
      </div>
    </div>
  );
};

const MyAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({ 
    present: 0, 
    total: 0, 
    percentage: 0,
    studentName: 'Student',
    usn: '',
    branch: ''
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const fallbackSessionStr = localStorage.getItem('forge_student_session');
        const fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;

        if (!session && !fallbackSession) return;

        const userId = session ? session.user.id : fallbackSession.id;
        
        let finalStudentId = fallbackSession?.student_id;
        let studentInfo = {
          studentName: fallbackSession?.display_name || 'Student',
          usn: fallbackSession?.usn || '',
          branch: fallbackSession?.branch || ''
        };

        // If we have an official session, or we need to refresh details from DB
        if (session || !finalStudentId) {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select(`
                student_id, 
                display_name,
                students (usn, branch_code, name)
              `)
              .eq('id', userId)
              .single();

            if (userData) {
              finalStudentId = userData.student_id;
              studentInfo = {
                studentName: userData.display_name || userData.students?.name || studentInfo.studentName,
                usn: userData.students?.usn || studentInfo.usn,
                branch: userData.students?.branch_code || studentInfo.branch
              };
            }
          } catch (e) {
            console.log("Could not fetch user record, using fallback session data.");
          }
        }

        // If we still don't have a student ID, we can't fetch attendance
        if (!finalStudentId) return;

        // Fetch attendance
        const { data: attendanceList } = await supabase
          .from('attendance')
          .select(`
            present,
            sessions (
              date,
              topic
            )
          `)
          .eq('student_id', finalStudentId)
          .order('session_id', { ascending: false });

        // Fetch recent materials
        const { data: recentMaterials } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!mounted) return;

        if (recentMaterials) {
          setMaterials(recentMaterials);
        }

        if (attendanceList) {
          setAttendanceData(attendanceList);
          const presentCount = attendanceList.filter(a => a.present).length;
          const totalCount = attendanceList.length;
          setStats({
            ...studentInfo,
            present: presentCount,
            total: totalCount,
            percentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
          });
        } else {
          setStats({ ...studentInfo, present: 0, total: 0, percentage: 0 });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => mounted = false;
  }, []);

  if (loading) {
    return <div className="text-secondary animate-pulse p-8">Loading your dashboard...</div>;
  }

  const firstName = stats.studentName.split(' ')[0];

  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[40px] md:text-[48px] font-bold text-white tracking-tight leading-none mb-2 flex items-center gap-3">
            Hello, {stats.studentName} <span className="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-body text-secondary mt-2">
            Track your attendance and access course materials.
          </p>
        </div>

        {stats.usn && (
          <div className="flex items-center gap-4 bg-surface-inset border border-subtle rounded-full py-2 px-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-primary font-medium">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-body font-bold text-white uppercase tracking-wider">{stats.usn}</span>
              <span className="text-caption text-secondary font-medium tracking-widest uppercase">{stats.branch} • STUDENT</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Attendance Card */}
        <div className="card bg-surface-inset border border-subtle p-8 flex flex-col items-center justify-center relative overflow-hidden group">
          <span className="absolute top-6 text-label text-secondary font-bold tracking-widest uppercase">ATTENDANCE</span>
          <div className="mt-8 mb-4">
            <CircularProgress percentage={stats.percentage} />
          </div>
          <span className="text-caption text-secondary font-medium">Minimum requirement: 75%</span>
        </div>

        {/* Sessions Card */}
        <div className="card bg-surface-inset border border-subtle p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-secondary mb-4">
            <Calendar size={20} />
            <span className="text-label font-bold tracking-widest uppercase">SESSIONS</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[48px] font-bold text-white leading-none tracking-tighter">
              {stats.present}
            </span>
            <span className="text-[32px] font-bold text-secondary">
              / {stats.total}
            </span>
          </div>
          <p className="text-body-sm text-secondary">Total classes attended so far</p>
        </div>

        {/* Rank Card */}
        <div className="card bg-surface-inset border border-subtle p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center gap-3 text-secondary mb-4">
            <TrendingUp size={20} />
            <span className="text-label font-bold tracking-widest uppercase">RANK</span>
          </div>
          <div className="text-[48px] font-bold text-white leading-none tracking-tighter mb-2">
            Top 10%
          </div>
          <p className="text-body-sm text-secondary">Based on current attendance</p>
        </div>
      </div>

      {/* Split Layout: Attendance Log & Learning Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Left Column: Attendance Log */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-h3 text-white">Attendance Log</h2>
            <Clock size={20} className="text-secondary" />
          </div>
          <div className="space-y-4">
            {attendanceData.length > 0 ? (
              attendanceData.slice(0, 4).map((record, index) => (
                <div key={index} className="card bg-surface-inset border border-subtle p-5 flex items-center justify-between hover:bg-surface-raised/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.present ? 'bg-success-bg text-success-fg' : 'bg-danger-bg text-danger-fg'}`}>
                      {record.present ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <h4 className="text-body-sm font-bold text-white mb-1">
                        {record.sessions?.topic || 'Unknown Topic'}
                      </h4>
                      <p className="text-caption text-secondary">
                        {record.sessions?.date ? new Date(record.sessions.date).toLocaleDateString() : 'Unknown Date'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {record.present ? (
                      <span className="px-3 py-1 rounded-md bg-success-fg/10 text-success-fg text-caption font-bold tracking-widest uppercase border border-success-fg/20">
                        PRESENT
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-md bg-danger-fg/10 text-danger-fg text-caption font-bold tracking-widest uppercase border border-danger-fg/20">
                        ABSENT
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="card bg-surface-inset border border-subtle p-8 text-center text-secondary">
                No attendance records found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Learning Materials */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-h3 text-white">Learning Materials</h2>
            <BookOpen size={20} className="text-secondary" />
          </div>
          <div className="space-y-4">
            {materials.length > 0 ? (
              materials.map((material) => (
                <a 
                  key={material.id}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card bg-surface-inset border border-subtle p-5 flex flex-col justify-center hover:bg-surface-raised/30 transition-colors group block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h4 className="text-body-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">
                        {material.title}
                      </h4>
                      <p className="text-caption text-secondary">
                        {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="card bg-surface-inset border border-subtle p-8 text-center text-secondary">
                No learning materials available yet.
              </div>
            )}
            
            {materials.length > 0 && (
              <div className="text-center pt-2">
                <Link to="/me/materials" className="text-primary hover:text-primary-hover text-body-sm font-medium transition-colors">
                  View all materials →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
