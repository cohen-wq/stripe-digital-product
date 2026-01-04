import { useState } from 'react';

interface JobFormProps {
    onSave: (jobData: any) => void;
    onClose: () => void;
    onAddToCalendar?: (eventData: any) => void;
}

export default function JobForm({ onSave, onClose, onAddToCalendar }: JobFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        clientName: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        budget: '',
        assignedTo: ''
    });
    const [addToCalendar, setAddToCalendar] = useState(false);
    const [calendarEventTime, setCalendarEventTime] = useState('09:00');
    const [calendarEventType, setCalendarEventType] = useState<'job' | 'meeting' | 'deadline'>('job');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const jobData = { ...formData };
        
        // Save the job
        onSave(jobData);
        
        // If Add to Calendar is checked, create calendar event
        if (addToCalendar && onAddToCalendar) {
            const calendarEvent = {
                title: `${formData.title} - ${formData.clientName}`,
                description: formData.description || `Job: ${formData.title}`,
                date: formData.dueDate || new Date().toISOString().split('T')[0],
                startTime: calendarEventTime,
                endTime: formatEndTime(calendarEventTime),
                type: calendarEventType,
                color: getEventColor(calendarEventType),
                clientName: formData.clientName,
                jobId: `JOB-${Date.now()}`
            };
            onAddToCalendar(calendarEvent);
            alert(`Job created and added to calendar as ${calendarEventType}!`);
        }
    };

    const formatEndTime = (startTime: string) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHour = hours + 1;
        return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'job': return 'bg-green-500';
            case 'meeting': return 'bg-blue-500';
            case 'deadline': return 'bg-red-500';
            default: return 'bg-green-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Create New Job</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter job title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the job details"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client/Business Name *
                                </label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter client name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Budget ($)
                                </label>
                                <input
                                    type="number"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned To
                            </label>
                            <input
                                type="text"
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Team member name or email"
                            />
                        </div>

                        {/* Add to Calendar Section */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start mb-3">
                                <input
                                    type="checkbox"
                                    id="addToCalendar"
                                    checked={addToCalendar}
                                    onChange={(e) => setAddToCalendar(e.target.checked)}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <label htmlFor="addToCalendar" className="block text-sm font-medium text-blue-800 cursor-pointer">
                                        Add to Calendar
                                    </label>
                                    <p className="text-xs text-blue-600">
                                        Create a calendar event for this job
                                    </p>
                                </div>
                            </div>

                            {addToCalendar && (
                                <div className="space-y-3 pl-7">
                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                            Event Type
                                        </label>
                                        <select
                                            value={calendarEventType}
                                            onChange={(e) => setCalendarEventType(e.target.value as any)}
                                            className="w-full px-3 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="job">Job/Project</option>
                                            <option value="meeting">Client Meeting</option>
                                            <option value="deadline">Deadline</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={calendarEventTime}
                                            onChange={(e) => setCalendarEventTime(e.target.value)}
                                            className="w-full px-3 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                        <p><strong>Event will be created with:</strong></p>
                                        <p>• Title: "{formData.title || '[Job Title]'}"</p>
                                        <p>• Date: {formData.dueDate || 'Today'}</p>
                                        <p>• Time: {calendarEventTime} - {formatEndTime(calendarEventTime)}</p>
                                        <p>• Type: {calendarEventType}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <div className="flex gap-3">
                                {addToCalendar && (
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                                    >
                                        Create Job & Add to Calendar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition"
                                >
                                    {addToCalendar ? 'Create Job Only' : 'Create Job'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}