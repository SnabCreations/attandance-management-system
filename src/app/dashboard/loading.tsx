export default function DashboardLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Stats/Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
            <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-8 w-16 bg-slate-300 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
        <div className="h-6 w-48 bg-slate-200 rounded-md mb-6"></div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
                </div>
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
