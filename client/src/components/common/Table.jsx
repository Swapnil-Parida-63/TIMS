import React from 'react';

export const Table = ({ headers, data, renderRow }) => {
  return (
    <div className="overflow-x-auto admin-card p-0 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {headers.map((h, i) => (
              <th key={i} className="py-4 px-6 text-sm font-semibold text-slate-600 whitespace-nowrap bg-slate-50/50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row._id || index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
              {renderRow(row, index)}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
         <div className="text-center py-12 text-slate-500 font-medium">No records found.</div>
      )}
    </div>
  );
};
