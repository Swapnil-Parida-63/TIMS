import React from 'react';
import clsx from 'clsx';

export const Card = ({ children, className }) => {
  return (
    <div className={clsx("admin-card p-6", className)}>
      {children}
    </div>
  );
};
