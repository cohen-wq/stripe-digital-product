import { useState } from 'react';
import ClientForm from '../forms/ClientForm';
import JobForm from '../forms/JobForm';
import InvoiceForm from '../forms/InvoiceForm';

interface QuickActionsProps {
    onAddCalendarEvent?: (event: any) => void;
}

export default function QuickActions({ onAddCalendarEvent }: QuickActionsProps) {
    const [showClientForm, setShowClientForm] = useState(false);
    const [showJobForm, setShowJobForm] = useState(false);
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    const handleSaveClient = (clientData: any) => {
        console.log('Client saved:', clientData);
        alert(`Client "${clientData.name}" saved successfully!`);
        setShowClientForm(false);
    };

    const handleSaveJob = (jobData: any) => {
        console.log('Job saved:', jobData);
        alert(`Job "${jobData.title}" created!`);
        setShowJobForm(false);
    };

    const handleSaveInvoice = (invoiceData: any) => {
        console.log('Invoice saved:', invoiceData);
        alert('Invoice generated!');
        setShowInvoiceForm(false);
    };

    const handleAddToCalendar = (eventData: any) => {
        if (onAddCalendarEvent) {
            onAddCalendarEvent(eventData);
            alert('Job added to calendar!');
        }
        setShowJobForm(false);
    };

    const actions = [
        {
            label: 'Add Client',
            description: 'Create new client profile',
            color: 'bg-blue-600 hover:bg-blue-700',
            onClick: () => setShowClientForm(true)
        },
        {
            label: 'Create Job',
            description: 'Start a new project',
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => setShowJobForm(true)
        },
        {
            label: 'Generate Invoice',
            description: 'Create new invoice',
            color: 'bg-purple-600 hover:bg-purple-700',
            onClick: () => setShowInvoiceForm(true)
        }
    ];

    return (
        <div className="quick-actions p-4">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className={`${action.color} text-white p-4 rounded-lg shadow-md transition duration-200`}
                        onClick={action.onClick}
                    >
                        <h3 className="font-bold text-lg">{action.label}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                    </button>
                ))}
            </div>

            {showClientForm && (
                <ClientForm
                    onSave={handleSaveClient}
                    onClose={() => setShowClientForm(false)}
                />
            )}

            {showJobForm && (
                <JobForm
                    onSave={handleSaveJob}
                    onClose={() => setShowJobForm(false)}
                    onAddToCalendar={handleAddToCalendar}
                />
            )}

            {showInvoiceForm && (
                <InvoiceForm
                    onSave={handleSaveInvoice}
                    onClose={() => setShowInvoiceForm(false)}
                />
            )}
        </div>
    );
}