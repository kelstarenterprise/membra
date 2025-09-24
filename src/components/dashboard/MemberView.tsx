export default function MemberView() {
  return (
    <div className="space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 rounded-xl p-6 shadow-sm border border-blue-600">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-blue-100">Your membership dashboard and quick overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Account Balance</h3>
          <div className="text-2xl font-bold text-blue-700">GHS 230</div>
          <p className="text-blue-600 text-sm mt-2">Current outstanding dues</p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Upcoming Events</h3>
          <div className="text-lg font-semibold text-blue-700">General Meeting</div>
          <p className="text-blue-600 text-sm mt-1">September 3, 2024</p>
        </div>
      </div>
    </div>
  );
}
