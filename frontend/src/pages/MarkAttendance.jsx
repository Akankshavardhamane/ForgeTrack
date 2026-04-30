import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

const MarkAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    // Fetch all sessions
    const { data: sessionData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    if (sessionData) setSessions(sessionData);

    // Fetch active students
    const { data: studentData } = await supabase.from('students').select('*').eq('is_active', true).order('usn', { ascending: true });
    if (studentData) {
      setStudents(studentData);
      const initialAttendance = {};
      studentData.forEach(s => initialAttendance[s.id] = true);
      setAttendance(initialAttendance);
    }

    if (sessionData && sessionData.length > 0 && studentData) {
      handleSessionChange(sessionData[0].id, studentData);
    }
    
    setLoading(false);
  };

  const handleSessionChange = async (sessionId, studentList = students) => {
    setSelectedSessionId(sessionId);
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('student_id, present')
      .eq('session_id', sessionId);
      
    if (existingAttendance && existingAttendance.length > 0) {
      const newAttendanceState = { ...attendance };
      existingAttendance.forEach(a => {
        newAttendanceState[a.student_id] = a.present;
      });
      setAttendance(newAttendanceState);
    } else {
      const newAttendanceState = {};
      studentList.forEach(s => newAttendanceState[s.id] = true);
      setAttendance(newAttendanceState);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const saveAttendance = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    
    const records = Object.keys(attendance).map(studentId => ({
      session_id: selectedSessionId,
      student_id: parseInt(studentId),
      present: attendance[studentId]
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id, session_id' });

    setSaving(false);
    if (!error) {
      alert('Attendance saved successfully!');
    } else {
      alert('Error saving attendance: ' + error.message);
    }
  };

  if (loading) return <div className="animate-pulse text-secondary">Loading attendance data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-display-sm text-primary">Mark Attendance</h1>
        <button 
          onClick={saveAttendance}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-label text-secondary mb-2">SELECT SESSION</label>
          <div className="relative">
            <select 
              value={selectedSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="input w-full appearance-none pr-10"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.date).toLocaleDateString()} - {s.topic}
                </option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-3 text-secondary pointer-events-none" size={18} />
          </div>
        </div>
        <div className="flex-1 flex gap-4 items-end">
          <div className="card bg-surface-inset p-3 flex-1 flex justify-between items-center border border-subtle">
            <span className="text-body-sm text-secondary">Present</span>
            <span className="text-h4 text-success-fg">
              {Object.values(attendance).filter(Boolean).length}
            </span>
          </div>
          <div className="card bg-surface-inset p-3 flex-1 flex justify-between items-center border border-subtle">
            <span className="text-body-sm text-secondary">Absent</span>
            <span className="text-h4 text-danger-fg">
              {Object.values(attendance).filter(v => !v).length}
            </span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-inset border-b border-subtle">
                <th className="p-4 text-label text-tertiary font-medium">USN</th>
                <th className="p-4 text-label text-tertiary font-medium">STUDENT NAME</th>
                <th className="p-4 text-label text-tertiary font-medium">STATUS</th>
                <th className="p-4 text-label text-tertiary font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b border-subtle hover:bg-surface-raised transition-colors">
                  <td className="p-4 text-body-sm font-medium text-secondary">{student.usn}</td>
                  <td className="p-4 text-body font-medium text-primary">{student.name}</td>
                  <td className="p-4">
                    {attendance[student.id] ? (
                      <span className="pill pill-present"><CheckCircle size={14} className="mr-1 inline"/> Present</span>
                    ) : (
                      <span className="pill pill-absent"><XCircle size={14} className="mr-1 inline"/> Absent</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => toggleAttendance(student.id)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
                        attendance[student.id] 
                          ? 'bg-surface hover:bg-danger-bg hover:text-danger-fg text-secondary'
                          : 'bg-surface hover:bg-success-bg hover:text-success-fg text-secondary'
                      }`}
                    >
                      Mark {attendance[student.id] ? 'Absent' : 'Present'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
