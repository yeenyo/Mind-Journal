// Small inline stroke-icon set — avoids pulling in an icon dependency.
function Icon({ path, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {typeof path === 'string' ? <path d={path} /> : path}
    </svg>
  );
}

export const PencilIcon = (p) => <Icon {...p} path="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />;

export const PatternIcon = (p) => (
  <Icon {...p} path={<><path d="M3 3v18h18" /><path d="m7 15 3.5-4 3 2.5L20 7" /></>} />
);

export const LockIcon = (p) => (
  <Icon
    {...p}
    path={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>}
  />
);

export const CompassIcon = (p) => (
  <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" /></>} />
);

export const ClockIcon = (p) => (
  <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.25 2" /></>} />
);

export const CheckIcon = (p) => <Icon {...p} path="M20 6 9 17l-5-5" />;

export const DownloadIcon = (p) => (
  <Icon {...p} path={<><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>} />
);

export const BookIcon = (p) => (
  <Icon
    {...p}
    path={<><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5z" /><path d="M9 3v18" /></>}
  />
);

export const MenuIcon = (p) => <Icon {...p} path={<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>} />;

export const CloseIcon = (p) => <Icon {...p} path={<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>} />;

export const ArrowLeftIcon = (p) => <Icon {...p} path={<><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>} />;

export const ArrowRightIcon = (p) => <Icon {...p} path={<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>} />;

export const ChevronDownIcon = (p) => <Icon {...p} path="m6 9 6 6 6-6" />;

export const SearchIcon = (p) => (
  <Icon {...p} path={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />
);

export const QuestionIcon = (p) => (
  <Icon
    {...p}
    path={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.95.75-.95 1.35v.5" /><path d="M12 17h.01" /></>}
  />
);

export const ShieldIcon = (p) => (
  <Icon {...p} path={<><path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3z" /><path d="m9 12 2 2 4-4" /></>} />
);

export const HeartIcon = (p) => (
  <Icon {...p} path="M12 20s-7-4.35-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.65 12 20 12 20z" />
);

export const SparkIcon = (p) => (
  <Icon {...p} path={<><path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="m6 6 2.5 2.5" /><path d="m15.5 15.5 2.5 2.5" /><path d="m18 6-2.5 2.5" /><path d="m8.5 15.5-2.5 2.5" /></>} />
);

export const ListIcon = (p) => (
  <Icon {...p} path={<><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></>} />
);

export const ExternalLinkIcon = (p) => (
  <Icon {...p} path={<><path d="M14 4h6v6" /><path d="m20 4-8 8" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>} />
);

export const ScaleIcon = (p) => (
  <Icon {...p} path={<><path d="M12 4v16" /><path d="M7 20h10" /><path d="M5 8h14" /><path d="m5 8-2.5 5a2.5 2.5 0 0 0 5 0L5 8z" /><path d="m19 8-2.5 5a2.5 2.5 0 0 0 5 0L19 8z" /></>} />
);
