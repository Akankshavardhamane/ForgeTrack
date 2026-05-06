import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

import RoleGuard from './components/RoleGuard';
import AppLayout from './components/layout/AppLayout';
import DevTokens from './DevTokens';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Forbidden from './pages/Forbidden';
import Placeholder from './pages/Placeholder';

import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import StudentHistory from './pages/StudentHistory';
import Materials from './pages/Materials';

// Student Pages
import MyAttendance from './pages/student/MyAttendance';
import UpcomingSessions from './pages/student/UpcomingSessions';
import StudyMaterials from './pages/student/StudyMaterials';

const RootRedirector = () => {
  const context = useOutletContext();
  const role = context?.role || 'mentor';
  return <Navigate to={role === 'mentor' ? '/dashboard' : '/me/attendance'} replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/dev-tokens" element={<DevTokens />} />

        {/* Protected Routes Wrapper */}
        <Route element={<RoleGuard />}>
          <Route element={<AppLayout />}>
            
            {/* Root redirect based on role */}
            <Route path="/" element={<RootRedirector />} />
            
            {/* Mentor Routes */}
            <Route element={<RoleGuard allowedRoles={['mentor']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<MarkAttendance />} />
              <Route path="/history" element={<StudentHistory />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/upload" element={<Placeholder title="CSV Upload Agent" />} />
            </Route>

            {/* Student Routes */}
            <Route element={<RoleGuard allowedRoles={['student']} />}>
              <Route path="/me/attendance" element={<MyAttendance />} />
              <Route path="/me/upcoming" element={<UpcomingSessions />} />
              <Route path="/me/materials" element={<StudyMaterials />} />
              <Route path="/me/appeals" element={<Placeholder title="Attendance Appeals" />} />
            </Route>

          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
