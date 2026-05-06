import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [role, setRole] = useState('mentor'); // 'mentor' or 'student'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = role === 'student' ? `${identifier}@forgetrack.com` : identifier;
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate('/'); // RoleGuard will redirect to appropriate dashboard
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Invalid credentials' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void app-main px-4">
      <div className="card w-full max-w-[440px] p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-surface-raised rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-h2">🌌</span>
          </div>
          <h2 className="text-h2">ForgeTrack</h2>
        </div>

        <div className="flex bg-surface-inset p-1 rounded-lg mb-8">
          <button
            onClick={() => setRole('mentor')}
            type="button"
            className={`flex-1 py-2 rounded-md text-body-sm font-medium transition-colors ${role === 'mentor' ? 'bg-surface-raised text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
          >
            Mentor Login
          </button>
          <button
            onClick={() => setRole('student')}
            type="button"
            className={`flex-1 py-2 rounded-md text-body-sm font-medium transition-colors ${role === 'student' ? 'bg-surface-raised text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-label text-secondary mb-2 tracking-wider">
              {role === 'mentor' ? 'EMAIL' : 'USN'}
            </label>
            <input
              type={role === 'mentor' ? 'email' : 'text'}
              className="input w-full"
              placeholder={role === 'mentor' ? 'mentor@forge.local' : '4SH24CS...'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-label text-secondary mb-2 tracking-wider">
              PASSWORD
            </label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-caption text-danger-fg bg-danger-bg p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
