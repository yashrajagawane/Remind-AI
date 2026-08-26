import CameraFeed from "@/components/CameraFeed";
import ReminderFeed from "@/components/ReminderFeed";
import SOSButton from "@/components/SOSButton";
import VoiceAssistant from "@/components/VoiceAssistant";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream font-sans p-4 md:p-8 relative">
      <header className="mb-8 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">ReMind AI</h1>
        <div className="text-2xl text-accent font-medium">Hello, Sarah</div>
      </header>
      
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Camera Feed */}
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 px-2">Face Recognition</h2>
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
