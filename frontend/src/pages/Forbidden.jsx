import React from 'react';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-void app-main">
      <div className="card max-w-md text-center p-8">
        <h1 className="text-display-lg text-danger-fg mb-4">403</h1>
        <h2 className="text-h2 mb-4">Access Denied</h2>
        <p className="text-body-lg text-secondary mb-8">
          You don't have permission to view this page.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary w-full"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
