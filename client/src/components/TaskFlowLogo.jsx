import React from 'react';

const TaskFlowLogo = ({ markClassName = 'h-10 w-10', textClassName = 'text-xl' }) => (
  <span className="inline-flex items-center gap-2.5">
    <svg
      aria-hidden="true"
      className={`${markClassName} shrink-0`}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="15" fill="#C2410C" />
      <path d="M14 15.5h20M24 15.5v17M14 24h10m0 0c0 4.7 3.8 8.5 8.5 8.5H34" stroke="#FFF7ED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="32.5" r="2" fill="#FDBA74" />
    </svg>
    <span className={`${textClassName} font-bold tracking-tight text-slate-950`}>taskflow</span>
  </span>
);

export default TaskFlowLogo;
