import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Calendar from "../components/calendar/Calendar";

export default function CalendarPage({ isPreview }: { isPreview: boolean }) {
  const navigate = useNavigate();
  const goSubscribe = () => navigate("/billing");

  return (
    <div className="space-y-6">
      {/* Preview banner */}
      {isPreview && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-700">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Preview mode</p>
                <p className="text-sm text-blue-800">
                  You can view the Calendar, but creating and editing events is locked.
                  Subscribe to unlock.
                </p>
              </div>
            </div>

            <button
              onClick={goSubscribe}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Subscribe to unlock
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="flex items-center gap-2 text-4xl font-bold text-gray-900">
          Calendar
          {isPreview && <Lock size={22} className="text-blue-700" />}
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your schedule, meetings, deadlines, and events
        </p>
      </div>

      {/* Calendar is visible in preview.
          Next step: we’ll update the Calendar component so it disables create/edit when isPreview=true. */}
      <Calendar isPreview={isPreview} />
    </div>
  );
}
