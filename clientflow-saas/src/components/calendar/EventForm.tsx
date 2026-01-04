import { useState } from 'react';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'meeting' | 'call' | 'job' | 'deadline' | 'reminder' | 'other';
    color: string;
    jobId?: string;
    clientName?: string;
}

interface EventFormProps {
    event: CalendarEvent | null;
    selectedDate: string;
    onSave: (eventData: Omit<CalendarEvent, 'id'>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export default function EventForm({ event, selectedDate, onSave, onDelete, onClose }: EventFormProps) {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        date: event?.date || selectedDate,
        startTime: event?.startTime || '09:00',
        endTime: event?.endTime || '10:00',
        type: event?.type || 'meeting',
        color: event?.color || 'bg-blue-500',
        jobId: event?.jobId || '',
        clientName: event?.clientName || ''
    });

    const colorOptions = [
        { value: 'bg-blue-500', label: 'Blue', color: 'bg-blue-500' },
        { value: 'bg-green-500', label: 'Green', color: 'bg-green-500' },
        { value: 'bg-red-500', label: 'Red', color: 'bg-red-500' },
        { value: 'bg-yellow-500', label: 'Yellow', color: 'bg-yellow-500' },
        { value: 'bg-purple-500', label: 'Purple', color: 'bg-purple-500' },
        { value: 'bg-pink-500', label: 'Pink', color: 'bg-pink-500' },
        { value: 'bg-indigo-500', label: 'Indigo', color: 'bg-indigo-500' },
        { value: 'bg-orange-500', label: 'Orange', color: 'bg-orange-500' }
    ];

    const typeOptions = [
        { value: 'meeting', label: 'Meeting', icon: '👥' },
        { value: 'call', label: 'Call', icon: '📞' },
        { value: 'job', label: 'Job', icon: '💼' },
        { value: 'deadline', label: 'Deadline', icon: '⏰' },
        { value: 'reminder', label: 'Reminder', icon: '🔔' },
        { value: 'other', label: 'Other', icon: '📅' }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<CalendarEvent, 'id'>);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {event ? 'Edit Event' : 'Add New Event'}
                        </h2>
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
                                Event Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event title"
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
                                placeholder="Enter event description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {typeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.icon} {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                                            className={`w-8 h-8 rounded-full ${color.color} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client/Business Name
                                </label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job ID
                                </label>
                                <input
                                    type="text"
                                    name="jobId"
                                    value={formData.jobId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 pt-6 border-t">
                            <div>
                                {event && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this event?')) {
                                                onDelete(event.id);
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                                    >
                                        Delete Event
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                                >
                                    {event ? 'Update Event' : 'Add Event'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}