"use client";

import { Activity, Clock, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function FamilyPortal() {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen p-6 sticky top-0">
        <div className="text-2xl font-bold text-gray-900 mb-8">ReMind Family</div>
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === "timeline" ? "bg-green-50 text-success font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Activity size={20} /> Daily Timeline
          </button>
          <button 
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === "photos" ? "bg-green-50 text-success font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ImageIcon size={20} /> My Photos
          </button>
          <button 
            onClick={() => setActiveTab("reminders")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === "reminders" ? "bg-green-50 text-success font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Clock size={20} /> Reminders
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Patient: Sarah Jenkins</h1>
          <button className="bg-white px-4 py-2 border rounded-lg shadow-sm text-gray-600 hover:bg-gray-50">
            Log out
          </button>
        </header>

        {activeTab === "timeline" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Activity</h2>
            <div className="relative border-l border-gray-200 ml-4 space-y-8">
              <div className="pl-6 relative">
                <div className="w-3 h-3 bg-success rounded-full absolute -left-1.5 top-1.5"></div>
                <p className="font-medium text-gray-900">Recognized You (Priya)</p>
                <p className="text-sm text-gray-500">Confidence: High • 10:30 AM</p>
              </div>
              <div className="pl-6 relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full absolute -left-1.5 top-1.5"></div>
                <p className="font-medium text-gray-900">Completed Medication "Blood Pressure"</p>
                <p className="text-sm text-gray-500">08:15 AM</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "photos" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Training Photos</h2>
              <button className="bg-success text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors">
                Upload New Photo
              </button>
            </div>
            <p className="text-gray-600 mb-6">These photos help ReMind AI recognize you better.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <ImageIcon className="text-gray-400" size={32} />
              </div>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <ImageIcon className="text-gray-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "reminders" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reminders</h2>
              <button className="bg-success text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors">
                Add Reminder
              </button>
            </div>
            <p className="text-gray-600 mb-6">Manage daily reminders for Sarah.</p>
            {/* Table or list of reminders could go here */}
          </div>
        )}
      </main>
    </div>
  );
}
