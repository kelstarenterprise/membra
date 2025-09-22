export default function MemberView() {
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold">Welcome back</h2>
        <p className="text-sm text-gray-600">Your quick overview.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          Current Balance: <strong>GHS 230</strong>
        </div>
        <div className="bg-white border rounded-xl p-4">
          Next Activity: <strong>General Meeting (Sep 3)</strong>
        </div>
      </div>
    </div>
  );
}
