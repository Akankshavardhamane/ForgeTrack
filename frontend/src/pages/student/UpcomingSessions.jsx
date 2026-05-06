import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';

const UpcomingSessions = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true });

        if (mounted && data) {
          setSessions(data);
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSessions();
    return () => mounted = false;
  }, []);

  if (loading) {
    return <div className="text-secondary animate-pulse p-8">Loading sessions...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {/* Hero Section */}
      <div>
        <h1 className="text-[48px] md:text-[64px] font-bold text-white tracking-tight leading-none mb-2">
          Upcoming Sessions
        </h1>
        <p className="text-body text-secondary mt-4">
          See what's next in your schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {sessions.length > 0 ? (
          sessions.map((session, idx) => {
            const isToday = new Date(session.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            
            return (
              <div key={session.id} className={`card border ${isToday ? 'border-primary/50 bg-primary/5' : 'border-subtle bg-surface-inset'} p-8 relative overflow-hidden group transition-all hover:border-primary/30`}>
                <div className="absolute right-0 top-0 opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                  <Calendar size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full min-h-[220px] justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-label text-secondary font-bold tracking-widest uppercase flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {isToday && (
                        <span className="pill border border-primary/30 bg-primary/10 text-primary flex items-center gap-2 px-3 py-1 rounded-full text-caption font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(var(--color-primary),0.2)]">
                          Today
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-[24px] font-bold text-white mb-4 leading-tight group-hover:text-primary transition-colors">
                      {session.topic}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center gap-3 text-secondary text-body-sm">
                      <Clock size={16} />
                      <span>{session.duration_hours || '2.0'} Hours</span>
                    </div>
                    <div className="flex items-center gap-3 text-secondary text-body-sm">
                      {session.session_type === 'online' ? <Video size={16} /> : <MapPin size={16} />}
                      <span className="capitalize">{session.session_type} Session</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full card bg-surface-inset border border-subtle p-12 text-center">
            <Calendar size={48} className="text-secondary/50 mx-auto mb-4" />
            <h3 className="text-h3 text-white mb-2">No Upcoming Sessions</h3>
            <p className="text-secondary">You don't have any sessions scheduled right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessions;
