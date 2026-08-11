// Charts are hand-built: horizontal bars in CSS (responsive and easy to label
// at 375px), the trend line in SVG (needs real coordinates). Palette is the
// validated pair — #2563eb primary, #10b981 second series. Every chart ships a
// table view, which is both the a11y fallback and the required relief for the
// green's sub-3:1 contrast against the card surface.

function TableView({ caption, headers, rows }) {
  return (
    <details className="mt-4 border-t border-slate-100 pt-3">
      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
        View as table
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-slate-500">
              {headers.map((h) => (
                <th key={h} scope="col" className="pb-2 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {row.map((cell, j) => (
                  <td key={j} className="py-1.5 pr-4 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function AvoidanceBars({ items }) {
  const max = Math.max(...items.map((i) => i.frequency), 1);

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.trigger}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium capitalize text-slate-800">
                {item.trigger}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {item.frequency}× {item.frequency === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100">
              {/* Bars grow from the axis on load. The width is already final —
                  the animation only scales it in, so nothing reflows. */}
              <div
                className="bar-grow stagger-item h-full rounded-full bg-brand-600"
                style={{
                  width: `${Math.max(4, (item.frequency / max) * 100)}%`,
                  '--stagger-index': i,
                }}
                title={`${item.trigger}: mentioned ${item.frequency} times`}
              />
            </div>
          </li>
        ))}
      </ul>
      <TableView
        caption="Avoidance triggers by frequency"
        headers={['Trigger', 'Times mentioned', 'First seen']}
        rows={items.map((i) => [
          i.trigger,
          i.frequency,
          new Date(i.firstSeen).toLocaleDateString(),
        ])}
      />
    </div>
  );
}

export function EstimateVsActual({ items }) {
  const max = Math.max(...items.flatMap((i) => [i.estimatedMinutes, i.actualMinutes]), 1);

  const fmt = (minutes) => (minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`);

  return (
    <div>
      {/* Two series, so a legend is mandatory — identity is never colour-alone. */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" aria-hidden="true" />
          You estimated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent-500" aria-hidden="true" />
          It actually took
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={`${item.date}-${i}`}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
              {item.difference && (
                <span className="font-medium text-slate-700">{item.difference}</span>
              )}
            </div>
            {/* 2px surface gap between the two fills. */}
            <div className="mt-1.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                  <div
                    className="bar-grow stagger-item h-full rounded-full bg-brand-600"
                    style={{
                      width: `${Math.max(3, (item.estimatedMinutes / max) * 100)}%`,
                      '--stagger-index': i,
                    }}
                    title={`Estimated ${fmt(item.estimatedMinutes)}`}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-600">
                  {fmt(item.estimatedMinutes)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                  <div
                    className="bar-grow stagger-item h-full rounded-full bg-accent-500"
                    style={{
                      width: `${Math.max(3, (item.actualMinutes / max) * 100)}%`,
                      '--stagger-index': i,
                    }}
                    title={`Actually took ${fmt(item.actualMinutes)}`}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-600">
                  {fmt(item.actualMinutes)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <TableView
        caption="Estimated versus actual time per task"
        headers={['Date', 'Estimated', 'Actual', 'Difference']}
        rows={items.map((i) => [
          new Date(i.date).toLocaleDateString(),
          i.estimated ?? fmt(i.estimatedMinutes),
          i.actual ?? fmt(i.actualMinutes),
          i.difference ?? '—',
        ])}
      />
    </div>
  );
}

export function EmotionalTrend({ points }) {
  const width = 640;
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 26, left: 28 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const x = (i) => pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (intensity) => pad.top + plotH - ((intensity - 1) / 9) * plotH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.intensity)}`).join(' ');

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full"
        role="img"
        aria-label="Emotional dysregulation intensity over time"
        preserveAspectRatio="none"
      >
        {/* Recessive gridlines at 1 / 5 / 10. */}
        {[1, 5, 10].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x="4" y={y(tick) + 4} fontSize="10" fill="#94a3b8">
              {tick}
            </text>
          </g>
        ))}

        {/* pathLength="1" normalises the path so the dash animation in
            .draw-line works without measuring it in JS — the line draws itself
            left to right, then the points pop in behind it. */}
        <path
          className="draw-line"
          d={line}
          pathLength="1"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={`${p.date}-${i}`}
            className="pop-in stagger-item"
            style={{ '--stagger-index': i, transformOrigin: `${x(i)}px ${y(p.intensity)}px` }}
            cx={x(i)}
            cy={y(p.intensity)}
            r="4.5"
            fill="#2563eb"
          >
            <title>
              {new Date(p.date).toLocaleDateString()} — intensity {p.intensity}
              {p.type ? ` (${p.type})` : ''}
            </title>
          </circle>
        ))}
      </svg>

      <div className="flex justify-between px-1 text-xs text-slate-500">
        <span>{new Date(points[0].date).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString()}</span>
      </div>

      <TableView
        caption="Emotional dysregulation intensity by date"
        headers={['Date', 'Intensity (1–10)', 'Type']}
        rows={points.map((p) => [
          new Date(p.date).toLocaleDateString(),
          p.intensity,
          p.type ?? '—',
        ])}
      />
    </div>
  );
}

export function TimeBlindnessTimeline({ events }) {
  return (
    <div>
      <ol className="relative flex flex-col gap-5 border-l border-slate-200 pl-5">
        {events.map((event, i) => (
          <li key={`${event.date}-${i}`} className="relative">
            <span
              className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-white"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-slate-500">
              {new Date(event.date).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {event.indicators.map((indicator, j) => (
                <li key={j} className="text-sm text-slate-800">
                  “{indicator}”
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <TableView
        caption="Time blindness incidents"
        headers={['Date', 'What you wrote']}
        rows={events.map((e) => [new Date(e.date).toLocaleString(), e.indicators.join('; ')])}
      />
    </div>
  );
}
