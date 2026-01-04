interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
}

const mockActivities: ActivityItem[] = [
  { id: 1, user: 'You', action: 'added', target: 'Client: Acme Corp', time: '10 min ago' },
  { id: 2, user: 'John Doe', action: 'updated', target: 'Job: Website Redesign', time: '1 hour ago' },
  { id: 3, user: 'You', action: 'completed', target: 'Job: Logo Design', time: '2 hours ago' },
  { id: 4, user: 'Sarah Smith', action: 'commented on', target: 'Project Dashboard', time: '3 hours ago' },
  { id: 5, user: 'You', action: 'created', target: 'Invoice #INV-2024-001', time: '1 day ago' },
];

export default function ActivityList() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {activity.user.charAt(0)}
              </span>
            </div>
            
            <div className="ml-4 flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{activity.user}</span>{' '}
                {activity.action}{' '}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      {mockActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
}