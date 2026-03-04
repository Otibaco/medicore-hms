export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-midnight p-8">
      <div className="max-w-7xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-3 w-32 bg-surface-3 rounded-full mb-2" />
          <div className="h-8 w-64 bg-surface-3 rounded-xl mb-2" />
          <div className="h-3 w-48 bg-surface-3 rounded-full" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-[#1e3252] bg-surface-2">
              <div className="h-3 w-24 bg-surface-3 rounded-full mb-4" />
              <div className="h-8 w-16 bg-surface-3 rounded-xl mb-2" />
              <div className="h-2 w-20 bg-surface-3 rounded-full" />
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-surface-2 border border-[#1e3252]" />
          <div className="h-80 rounded-2xl bg-surface-2 border border-[#1e3252]" />
        </div>
      </div>
    </div>
  );
}
