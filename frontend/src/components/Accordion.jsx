import { useId, useState } from 'react';
import { ChevronDownIcon } from './Icons';

// Expand/collapse without measuring heights in JS: the panel is a grid row that
// animates 0fr → 1fr, so the transition works for any content length and
// survives a window resize mid-animation. The panel stays mounted and is hidden
// with `visibility` rather than unmounted, so in-page search still finds the
// answer text.
export function AccordionItem({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="press group flex w-full items-start justify-between gap-4 rounded-md px-1 py-4 text-left transition-colors hover:text-brand-700"
        >
          <span className="text-[15px] font-medium text-gray-900 group-hover:text-brand-700">
            {question}
          </span>
          <ChevronDownIcon
            className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ease-out group-hover:text-brand-600 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-all duration-200 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className={`overflow-hidden ${open ? '' : 'invisible'}`}>
          <div className="px-1 pb-5 text-[15px] leading-relaxed text-gray-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Accordion({ children, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white px-4 shadow-card sm:px-5 ${className}`}>
      {children}
    </div>
  );
}
