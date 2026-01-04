interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({ title, value, icon, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span className={`text-sm ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="text-gray-400 text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}