import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions({ isPreview = false }: { isPreview?: boolean }) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add Client",
      description: "Create new client profile",
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate("/clients?new=1"),
    },
    {
      label: "Create Job",
      description: "Start a new project",
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => navigate("/jobs?new=1"),
    },
    {
      label: "Generate Invoice",
      description: "Create new invoice",
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: () => navigate("/invoices?new=1"),
    },
  ];

  return (
    <div className="quick-actions p-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
        Quick Actions
        {isPreview && <Lock size={18} className="text-blue-700" />}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`text-white p-4 rounded-lg shadow-md transition duration-200 ${
              isPreview ? "bg-gray-300 cursor-not-allowed" : action.color
            }`}
            onClick={() => {
              if (isPreview) {
                navigate("/billing");
                return;
              }
              action.onClick();
            }}
            disabled={isPreview}
            title={isPreview ? "Subscribe to unlock" : action.label}
          >
            <h3 className="font-bold text-lg">{action.label}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
