"use client";

import { Users, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen p-6 sticky top-0">
        <div className="text-2xl font-bold text-gray-900 mb-8">ReMind Admin</div>
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === "overview" ? "bg-blue-50 text-accent font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Activity size={20} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab("network")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === "network" ? "bg-blue-50 text-accent font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Users size={20} /> Support Network
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

        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="font-medium">Faces Recognized</span>
                  <Users size={20} />
                </div>
                <div className="text-3xl font-bold text-gray-900">12 Today</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="font-medium">Reminders Completed</span>
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div className="text-3xl font-bold text-gray-900">85%</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="font-medium">Missed Alerts</span>
                  <AlertTriangle size={20} className="text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">2</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="font-medium">SOS Events</span>
                  <Activity size={20} className="text-emergency" />
                </div>
                <div className="text-3xl font-bold text-gray-900">0</div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Recognized &ldquo;Priya (Daughter)&rdquo;</p>
                    <p className="text-sm text-gray-500">Confidence: High</p>
                  </div>
                  <span className="text-sm text-gray-500">10 mins ago</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Completed Medication &ldquo;Blood Pressure&rdquo;</p>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Family & Known Persons</h2>
              <button className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                + Add Person
              </button>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Relationship</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-4 font-medium">Priya</td>
                  <td className="py-4 text-gray-600">Daughter</td>
                  <td className="py-4 text-gray-600">+1 234 567 8900</td>
                  <td className="py-4 text-right">
                    <button className="text-accent hover:underline mr-4">Edit</button>
                    <button className="text-emergency hover:underline">Remove</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-4 font-medium">Dr. Sharma</td>
                  <td className="py-4 text-gray-600">Doctor</td>
                  <td className="py-4 text-gray-600">+1 987 654 3210</td>
                  <td className="py-4 text-right">
                    <button className="text-accent hover:underline mr-4">Edit</button>
                    <button className="text-emergency hover:underline">Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
