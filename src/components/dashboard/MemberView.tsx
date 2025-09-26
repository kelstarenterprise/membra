export default function MemberView() {
  return (
    <div className="space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-xl p-6 shadow-elegant border border-green-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Welcome Back</h1>
          <p className="text-green-50 text-lg">Your membership dashboard and quick overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-elegant hover-lift transition-all">
          <h3 className="text-lg font-semibold text-primary mb-4 border-accent-purple pl-4">Account Balance</h3>
          <div className="text-3xl font-bold text-primary">GHS 230</div>
          <p className="text-accent text-sm mt-2 font-medium">Current outstanding dues</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-elegant hover-lift transition-all">
          <h3 className="text-lg font-semibold text-primary mb-4 border-accent-purple pl-4">Upcoming Events</h3>
          <div className="text-xl font-bold text-accent">General Meeting</div>
          <p className="text-muted-foreground text-sm mt-1">September 3, 2024</p>
        </div>
      </div>
    </div>
  );
}
