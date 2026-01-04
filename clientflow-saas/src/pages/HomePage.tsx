import QuickActions from '../components/dashboard/QuickActions';

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600 mb-8">Welcome back! Here's what's happening with your business.</p>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Clients Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Clients</h3>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500 mt-2">→ Add your first client</p>
                </div>
                
                {/* Active Jobs Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Jobs</h3>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500 mt-2">No active jobs</p>
                </div>
                
                {/* Completed Jobs Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed Jobs</h3>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500 mt-2">No completions yet</p>
                </div>
                
                {/* Revenue Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue This Month</h3>
                    <p className="text-3xl font-bold text-gray-800">$0</p>
                    <p className="text-sm text-gray-500 mt-2">→ Start earning</p>
                </div>
            </div>

            {/* Quick Actions Section */}
            <section className="mb-8">
                <QuickActions />
            </section>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {/* Activity items... */}
                </div>
            </div>
        </div>
    );
}