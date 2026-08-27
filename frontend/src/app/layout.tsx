import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReMind AI — Memory Companion",
    template: "%s · ReMind AI",
  },
  description:
    "An AI-powered memory companion that helps people living with dementia recognize loved ones, remember daily activities, and stay safe — with a voice-first, accessible interface for caregivers and family.",
  applicationName: "ReMind AI",
  keywords: [
    "dementia care",
    "memory companion",
    "face recognition",
    "medication reminders",
    "caregiver",
    "healthcare AI",
  ],
  authors: [{ name: "Yashraj Agawane" }],
};

export const viewport: Viewport = {
  themeColor: "#4A90D9",
  width: "device-width",
  initialScale: 1,
};

// Runs before paint to apply the saved (or system) color theme and avoid a
// flash of the wrong theme. Kept in sync with the key used by the UI store.
const themeInitScript = `(function(){try{var t=localStorage.getItem('remind-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
