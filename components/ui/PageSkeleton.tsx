export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat">
      <div className="skeleton mb-2 h-8 w-64" />
      <div className="skeleton mb-6 h-4 w-40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[92px]" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="skeleton h-[320px] lg:col-span-7" />
        <div className="skeleton h-[320px] lg:col-span-5" />
      </div>
    </div>
  );
}
