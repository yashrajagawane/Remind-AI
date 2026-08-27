"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Brain,
  HeartHandshake,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const roles = [
  {
    key: "patient",
    title: "Patient Companion",
    description:
      "A calm, voice-first screen that recognizes loved ones, reads out daily reminders, and puts help one tap away.",
    icon: ScanFace,
    href: "/patient",
    cta: "Open companion",
    available: true,
  },
  {
    key: "caregiver",
    title: "Caregiver Dashboard",
    description:
      "Manage reminders, review recognition history, and get alerted the moment something needs attention.",
    icon: HeartHandshake,
    href: "/caregiver",
    cta: "Open dashboard",
    available: true,
  },
  {
    key: "family",
    title: "Family Portal",
    description:
      "Add faces and memories, share updates, and stay connected with the people caring for your loved one.",
    icon: Users,
    href: "/family",
    cta: "Open portal",
    available: true,
  },
] as const;

const highlights = [
  { icon: ScanFace, label: "Face recognition in under 2 seconds" },
  { icon: Sparkles, label: "Gentle voice guidance" },
  { icon: ShieldCheck, label: "One-tap emergency SOS" },
] as const;

export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <main className="bg-background text-foreground relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* Warm brand glow — adapts to light/dark via alpha */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(74,144,217,0.14),transparent)]"
      />

      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ReMind AI home">
          <span className="bg-brand inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm">
            <Brain size={22} aria-hidden />
          </span>
          <span className="text-xl font-semibold tracking-tight">ReMind AI</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-10 pb-14 text-center sm:pt-16"
      >
        <motion.span
          variants={item}
          className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
        >
          <Sparkles size={16} className="text-brand" aria-hidden />
          AI-Powered Memory Companion
        </motion.span>

        <motion.h1
          variants={item}
          className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          Helping loved ones stay <span className="text-brand">connected and safe</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty sm:text-xl"
        >
          ReMind AI recognizes familiar faces, remembers daily activities, and offers gentle,
          voice-first guidance for people living with dementia — with peace of mind for the
          caregivers and family who support them.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/patient"
            className="bg-brand hover:bg-brand/90 focus-visible:ring-brand focus-visible:ring-offset-background inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold text-white shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Open patient companion
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            href="#roles"
            className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full border px-7 text-base font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Explore roles
          </a>
        </motion.div>

        {/* Highlights */}
        <motion.ul
          variants={item}
          className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
        >
          {highlights.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2">
              <Icon size={18} className="text-success" aria-hidden />
              {label}
            </li>
          ))}
        </motion.ul>
      </motion.section>

      {/* Role cards */}
      <motion.section
        id="roles"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-3"
        aria-label="Choose your role"
      >
        {roles.map(({ key, title, description, icon: Icon, href, cta, available }) => {
          const cardBody = (
            <>
              <span className="bg-brand/10 text-brand inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <Icon size={26} aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                {description}
              </p>
              <span
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
                  available ? "text-brand" : "text-muted-foreground"
                }`}
              >
                {cta}
                {available && <ArrowRight size={16} aria-hidden />}
              </span>
            </>
          );

          const baseClass =
            "group flex h-full flex-col rounded-3xl border border-border bg-card p-7 text-left shadow-sm transition-all";

          return available ? (
            <motion.div key={key} variants={item}>
              <Link
                href={href}
                className={`${baseClass} focus-visible:ring-brand hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none`}
              >
                {cardBody}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key={key}
              variants={item}
              aria-disabled
              className={`${baseClass} opacity-70`}
            >
              {cardBody}
            </motion.div>
          );
        })}
      </motion.section>

      {/* Footer */}
      <footer className="border-border mt-auto border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm sm:flex-row">
          <span>© 2026 ReMind AI</span>
          <span>Built with care for patients, caregivers, and families.</span>
        </div>
      </footer>
    </main>
  );
}
