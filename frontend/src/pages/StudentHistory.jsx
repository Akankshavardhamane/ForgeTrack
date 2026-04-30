import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, TrendingUp } from 'lucide-react';

const StudentHistory = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name');
    if (data) setStudents(data);
  };

  const fetchSessions = async () => {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: true });
    if (data) setSessions(data);
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    const { data } = await supabase
      .from('attendance')
      .select('*, sessions(*)')
      .eq('student_id', student.id);
    
    if (data) {
      setAttendanceRecords(data);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClasses = attendanceRecords.length;
  const presentClasses = attendanceRecords.filter(r => r.present).length;
  const percentage = totalClasses ? Math.round((presentClasses / totalClasses) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-primary">Student History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Search & List */}
        <div className="card p-6 col-span-1 flex flex-col h-[600px]">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-secondary pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search USN or Name..."
              className="input w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => selectStudent(student)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedStudent?.id === student.id 
                    ? 'bg-surface-raised border-accent-glow text-primary'
                    : 'bg-surface-inset border-subtle text-secondary hover:border-secondary'
                }`}
              >
                <div className="font-medium">{student.name}</div>
                <div className="text-caption text-tertiary">{student.usn}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              {/* Profile Card */}
              <div className="card p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start border border-subtle">
                <div className="w-20 h-20 bg-surface-inset rounded-full flex items-center justify-center border-2 border-accent-glow shrink-0">
                  <User size={32} className="text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-h3 text-primary mb-1">{selectedStudent.name}</h2>
                  <p className="text-body text-secondary mb-4">{selectedStudent.usn} • {selectedStudent.branch_code}</p>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="bg-surface-inset px-4 py-2 rounded-md border border-subtle">
                      <span className="block text-caption text-tertiary">Attendance</span>
                      <span className={`text-h4 ${percentage >= 75 ? 'text-success-fg' : 'text-danger-fg'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="bg-surface-inset px-4 py-2 rounded-md border border-subtle">
                      <span className="block text-caption text-tertiary">Present</span>
                      <span className="text-h4 text-primary">{presentClasses} / {totalClasses}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="card p-6 border border-subtle">
                <h3 className="text-h4 mb-4">Attendance Heatmap</h3>
                <div className="flex flex-wrap gap-2">
                  {sessions.map(session => {
                    const record = attendanceRecords.find(r => r.session_id === session.id);
                    let colorClass = 'bg-surface-inset border border-subtle'; // Upcoming/Unmarked
                    if (record) {
                      colorClass = record.present ? 'bg-success-fg shadow-[0_0_8px_rgba(46,204,113,0.3)]' : 'bg-danger-fg shadow-[0_0_8px_rgba(231,76,60,0.3)]';
                    }
                    
                    return (
                      <div 
                        key={session.id} 
                        title={`${new Date(session.date).toLocaleDateString()}: ${session.topic}`}
                        className={`w-8 h-8 rounded-sm ${colorClass} transition-opacity hover:opacity-80 cursor-pointer`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-4 text-caption text-secondary">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-success-fg"></div> Present</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-danger-fg"></div> Absent</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-surface-inset border border-subtle"></div> Unmarked</div>
                </div>
              </div>
            </>
          ) : (
            <div className="card h-[600px] flex items-center justify-center flex-col text-tertiary border border-subtle">
              <User size={48} className="mb-4 opacity-50" />
              <p className="text-body-lg">Select a student to view history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
