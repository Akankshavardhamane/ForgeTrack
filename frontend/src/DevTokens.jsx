import React from 'react';

const DevTokens = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-display-lg">Design System Tokens</h1>
      
      <div className="card space-y-4">
        <h3 className="text-h3">Component Test Card</h3>
        <p className="text-body-lg text-fg-secondary">
          Testing card styles, fonts, and borders on the glass surface.
        </p>

        <div className="flex gap-4 items-center flex-wrap mt-6">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          
          <input type="text" className="input" placeholder="Test input..." />
          
          <span className="pill pill-success">Present</span>
          <span className="pill pill-danger">Absent</span>
        </div>
      </div>
    </div>
  );
};

export default DevTokens;
