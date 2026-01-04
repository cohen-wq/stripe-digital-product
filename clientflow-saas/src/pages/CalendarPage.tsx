import Calendar from '../components/calendar/Calendar';

export default function CalendarPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
                <p className="text-gray-600">Manage your schedule, meetings, deadlines, and events</p>
            </div>
            
            {/* Full-page Calendar */}
            <Calendar />
            
            {/* Optional: Add some helpful tips */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📅 Calendar Tips</h3>
                <ul className="space-y-2 text-blue-700">
                    <li>• Click any date to add a new event</li>
                    <li>• Click on events to edit or delete them</li>
                    <li>• Use different colors for different event types</li>
                    <li>• Set reminders for important deadlines</li>
                    <li>• Add jobs directly to calendar from the Job Form</li>
                </ul>
            </div>
        </div>
    );
}