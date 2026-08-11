import { useEffect, useRef, useState } from 'react';
import useReducedMotion from './useReducedMotion';

// Counts from 0 to `value` on mount. requestAnimationFrame rather than a CSS
// counter: @property-driven counters still don't animate in every browser we
// support, and a stat that silently renders as 0 is worse than one that doesn't
// move.
//
// Whole numbers only — these are entry counts and percentages, and a stat tile
// flickering through decimals is noise.
export default function useCountUp(value, { duration = 700 } = {}) {
  const target = Number.isFinite(value) ? value : 0;
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? target : 0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (reducedMotion || duration <= 0 || target === 0) {
      setDisplay(target);
      return undefined;
    }

    let start = null;
    // easeOutCubic — fast off the mark, settles gently on the final value.
    const ease = (t) => 1 - (1 - t) ** 3;

    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      setDisplay(Math.round(ease(progress) * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, reducedMotion]);

  return display;
}
