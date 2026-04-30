import React from 'react';

const Placeholder = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <h1 className="text-display-md text-secondary mb-4">{title}</h1>
      <p className="text-body-lg text-tertiary">This page will be built in the next phase.</p>
    </div>
  );
};

export default Placeholder;
