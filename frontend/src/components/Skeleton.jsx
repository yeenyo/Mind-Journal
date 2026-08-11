// Shape mirrors a real entry card (radius, padding, elevation) so the swap from
// skeleton to content doesn't shift the layout.
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
      <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
