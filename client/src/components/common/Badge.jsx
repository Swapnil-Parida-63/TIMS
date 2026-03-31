import React from 'react';
import clsx from 'clsx';

export const Badge = ({ status }) => {
  const styles = {
    applied:              'bg-blue-50 text-blue-700 border-blue-200',
    'interview scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
    standby:              'bg-yellow-50 text-yellow-700 border-yellow-200',
    selected:             'bg-green-50 text-green-700 border-green-200',
    rejected:             'bg-red-50 text-red-700 border-red-200',
    // Interview statuses
    scheduled:            'bg-purple-50 text-purple-700 border-purple-200',
    completed:            'bg-green-50 text-green-700 border-green-200',
    cancelled:            'bg-red-50 text-red-700 border-red-200',
    // Recording statuses
    pending:              'bg-yellow-50 text-yellow-700 border-yellow-200',
    available:            'bg-green-50 text-green-700 border-green-200',
    deleted:              'bg-slate-100 text-slate-500 border-slate-200',
    // Teacher
    active:               'bg-green-50 text-green-700 border-green-200',
  };

  const key = status?.toLowerCase();
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize',
      styles[key] || 'bg-slate-100 text-slate-600 border-slate-200'
    )}>
      {status || '—'}
    </span>
  );
};
