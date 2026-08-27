"use client";

import { Pill, Clock, CalendarHeart, Coffee } from "lucide-react";

const reminders = [
  { id: 1, type: "medication", title: "Take Blood Pressure Pill", time: "08:00 AM", status: "completed" },
  { id: 2, type: "meal", title: "Breakfast", time: "09:00 AM", status: "completed" },
  { id: 3, type: "medication", title: "Vitamins", time: "12:00 PM", status: "upcoming" },
  { id: 4, type: "appointment", title: "Dr. Sharma Checkup", time: "04:00 PM", status: "upcoming" },
];

export default function ReminderFeed() {
  const getIcon = (type: string) => {
    switch (type) {
      case "medication": return <Pill size={32} />;
      case "meal": return <Coffee size={32} />;
      case "appointment": return <CalendarHeart size={32} />;
      default: return <Clock size={32} />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-[50vh] overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 sticky top-0 bg-white pb-4 border-b border-gray-100 z-10">
        Today&apos;s Reminders
      </h2>
      
      <div className="flex flex-col gap-4">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id}
            className={`p-6 rounded-2xl border-l-8 flex items-center gap-6 ${
              reminder.status === "completed" 
                ? "bg-gray-50 border-gray-300 opacity-70" 
                : "bg-blue-50 border-accent shadow-sm"
            }`}
          >
            <div className={`p-4 rounded-full ${
              reminder.status === "completed" ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-accent"
            }`}>
              {getIcon(reminder.type)}
            </div>
            
            <div className="flex-1">
              <h3 className={`text-2xl font-semibold ${
                reminder.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
              }`}>
                {reminder.title}
              </h3>
              <p className="text-xl text-gray-600 mt-1">{reminder.time}</p>
            </div>

            {reminder.status === "upcoming" && (
              <button className="bg-success text-white px-6 py-4 rounded-xl text-xl font-medium hover:bg-green-600 transition-colors">
                Done
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
