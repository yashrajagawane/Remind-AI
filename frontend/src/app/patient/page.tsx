import type { Metadata } from "next";

import CameraFeed from "@/components/CameraFeed";
import ReminderFeed from "@/components/ReminderFeed";
import SOSButton from "@/components/SOSButton";
import VoiceAssistant from "@/components/VoiceAssistant";

export const metadata: Metadata = {
  title: "Patient Companion",
  description:
    "A calm, voice-first companion screen: recognize loved ones, hear reminders, and reach help with one tap.",
};

export default function PatientHome() {
  return (
    <div className="bg-cream relative min-h-screen p-4 font-sans md:p-8">
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">ReMind AI</h1>
        <div className="text-brand text-2xl font-medium">Hello, Sarah</div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Camera Feed */}
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-4 px-2 text-2xl font-semibold text-gray-800">Face Recognition</h2>
            <CameraFeed />
          </section>
        </div>

        {/* Right Column: Reminders */}
        <div className="flex flex-col gap-8">
          <ReminderFeed />
        </div>
      </main>

      {/* Floating Emergency Button */}
      <SOSButton />
      <VoiceAssistant />
    </div>
  );
}
