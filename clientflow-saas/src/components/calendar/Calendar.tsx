import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import EventForm from "./EventForm";
import { supabase } from "../../lib/supabase";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-MM-dd (UI field)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: "meeting" | "call" | "job" | "deadline" | "reminder" | "other";
  color: string;
  jobId?: string;
  clientName?: string;
  user_id: string;
}

export default function Calendar({ isPreview = false }: { isPreview?: boolean }) {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [status, setStatus] = useState<{ type: "idle" | "ok" | "err"; message: string }>({
    type: "idle",
    message: "",
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), "MMMM"),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthYear = format(currentDate, "MMMM yyyy");

  const goSubscribe = () => navigate("/billing");

  const previewBlocked = () => {
    setStatus({
      type: "err",
      message: "Preview mode: Subscribe to create or edit calendar events.",
    });
    goSubscribe();
  };

  // DB row (snake_case + event_date) -> UI event (camelCase + date)
  const normalizeRow = (row: any): CalendarEvent => ({
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    date: row.event_date ?? "",
    startTime: row.start_time ?? "09:00",
    endTime: row.end_time ?? "10:00",
    type: (row.type ?? "meeting") as CalendarEvent["type"],
    color: row.color ?? "bg-blue-500",
    jobId: row.job_id ?? "",
    clientName: row.client_name ?? "",
    user_id: row.user_id,
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id,title,description,event_date,start_time,end_time,type,color,job_id,client_name,user_id")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setEvents((data ?? []).map(normalizeRow));
      setStatus({ type: "idle", message: "" });
    } catch (err: any) {
      console.error("loadEvents error:", err);
      setEvents([]);
      setStatus({ type: "err", message: err?.message || "Could not load events." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((event) => event.date === dateStr);
  };

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), monthIndex, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  const handleAddEvent = (date: Date) => {
    if (isPreview) return previewBlocked();

    setSelectedDate(format(date, "yyyy-MM-dd"));
    setSelectedEvent(null);
    setShowEventForm(true);
    setStatus({ type: "idle", message: "" });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (isPreview) return previewBlocked();

    setSelectedEvent(event);
    setShowEventForm(true);
    setStatus({ type: "idle", message: "" });
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id" | "user_id">) => {
    if (isPreview) return previewBlocked();

    try {
      setStatus({ type: "idle", message: "" });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setStatus({ type: "err", message: "Not signed in." });
        return;
      }

      const payload = {
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        type: eventData.type,
        color: eventData.color,
        job_id: eventData.jobId?.trim() ? eventData.jobId : null,
        client_name: eventData.clientName?.trim() ? eventData.clientName : null,
      };

      if (selectedEvent) {
        const { error } = await supabase.from("calendar_events").update(payload).eq("id", selectedEvent.id);
        if (error) throw error;
        setStatus({ type: "ok", message: "Event updated." });
      } else {
        const { error } = await supabase.from("calendar_events").insert(payload);
        if (error) throw error;
        setStatus({ type: "ok", message: "Event added." });
      }

      setShowEventForm(false);
      setSelectedEvent(null);

      await loadEvents();
    } catch (err: any) {
      console.error("handleSaveEvent error:", err);
      setStatus({ type: "err", message: err?.message || "Save failed." });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (isPreview) return previewBlocked();

    try {
      setStatus({ type: "idle", message: "" });

      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;

      setShowEventForm(false);
      setSelectedEvent(null);

      setStatus({ type: "ok", message: "Event deleted." });
      await loadEvents();
    } catch (err: any) {
      console.error("handleDeleteEvent error:", err);
      setStatus({ type: "err", message: err?.message || "Delete failed." });
    }
  };

  const getEventTypeIcon = (type: CalendarEvent["type"]) => {
    const icons = {
      meeting: "👥",
      call: "📞",
      job: "💼",
      deadline: "⏰",
      reminder: "🔔",
      other: "📅",
    };
    return icons[type];
  };

  const upcomingEvents = useMemo(() => {
    return events
      .slice()
      .sort(
        (a, b) =>
          new Date(a.date + "T" + a.startTime).getTime() - new Date(b.date + "T" + b.startTime).getTime()
      )
      .filter((event) => new Date(event.date) >= new Date())
      .slice(0, 5);
  }, [events]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendar & Agenda</h2>
          <p className="text-gray-600">Schedule and manage all your events</p>
        </div>

        {/* Add Event (locked in preview) */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (isPreview) return previewBlocked();

              setSelectedDate(format(new Date(), "yyyy-MM-dd"));
              setSelectedEvent(null);
              setShowEventForm(true);
              setStatus({ type: "idle", message: "" });
            }}
            disabled={isPreview}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${
              isPreview
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            title={isPreview ? "Subscribe to unlock" : "Add Event"}
          >
            <span>+</span>
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {status.type !== "idle" && (
        <div
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            status.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full" title="Previous Month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full" title="Next Month">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="text-xl font-semibold text-gray-800 hidden md:block">{monthYear}</div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Events: {loading ? 0 : events.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {weekdays.map((day: string) => (
          <div key={day} className="bg-gray-50 p-3 text-center">
            <span className="text-sm font-medium text-gray-600">{day}</span>
          </div>
        ))}

        {daysInMonth.map((day: Date, index: number) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[120px] bg-white p-2 ${!isCurrentMonth ? "bg-gray-50" : ""} ${
                isCurrentDay ? "bg-blue-50" : ""
              } ${isPreview ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => handleAddEvent(day)}
              title={isPreview ? "Subscribe to add events" : "Add event"}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrentDay
                      ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && <span className="text-xs text-gray-500">{dayEvents.length}</span>}
              </div>

              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded ${event.color} text-white truncate ${
                      isPreview ? "cursor-default opacity-90" : "cursor-pointer"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                    title={
                      isPreview
                        ? "Subscribe to edit events"
                        : `${event.title} (${event.startTime}-${event.endTime})`
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span>{getEventTypeIcon(event.type)}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h3>

        {!loading && events.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
            No events yet. Click a date or press “Add Event” to create your first event.
          </div>
        )}

        <div className={`space-y-3 ${isPreview ? "opacity-95" : ""}`}>
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 ${
                isPreview ? "cursor-default" : "cursor-pointer"
              }`}
              onClick={() => handleEditEvent(event)}
              title={isPreview ? "Subscribe to edit events" : "Edit event"}
            >
              <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">{event.title}</span>
                  <span className="text-sm text-gray-500">
                    {format(parseISO(event.date), "MMM d")} • {event.startTime}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{event.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded">{event.type}</span>
                  {event.clientName && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {event.clientName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paid/admin only: form never appears in preview */}
      {!isPreview && showEventForm && (
        <EventForm
          event={selectedEvent}
          selectedDate={selectedDate}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
