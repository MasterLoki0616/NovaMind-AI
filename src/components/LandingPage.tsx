import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  Code2,
  Command,
  Download,
  ExternalLink,
  Globe,
  Instagram,
  Mail,
  MessageSquareText,
  Mic,
  MonitorSmartphone,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import founderPhotoUrl from "../../davutbaran.jpeg";
import logoUrl from "../../logo.png";
import { cn } from "../lib/utils";
import { buttonVariants } from "./ui/button";

type Feature = { icon: LucideIcon; title: string; text: string };

const navItems = [
  ["About", "#about"],
  ["Features", "#features"],
  ["FAQ", "#faq"],
  ["Contact", "#contact"]
] as const;

const features: Feature[] = [
  { icon: MessageSquareText, title: "Smart AI Chat", text: "Human-like conversation that stays useful." },
  { icon: ScanSearch, title: "Screen Understanding", text: "AI sees the live context on your screen." },
  { icon: Mic, title: "Voice Interaction", text: "Natural voice control with faster flows." },
  { icon: BrainCircuit, title: "Memory System", text: "A second-brain layer that remembers what matters." },
  { icon: Bot, title: "Personal Assistant", text: "A focused AI partner for daily execution." },
  { icon: WandSparkles, title: "Project Fixing", text: "Spot issues fast and move toward a fix." },
  { icon: Command, title: "Terminal Automation", text: "Command-safe workflows for technical users." },
  { icon: Workflow, title: "Open & Close Apps", text: "Reduce friction across repeated routines." },
  { icon: Code2, title: "Code Support", text: "Generate, explain, and debug faster." },
  { icon: Zap, title: "Task Automation", text: "Delegate repetitive work and keep momentum." }
];

const upcoming = [
  ["Autonomous Agents", "Persistent AI workers that plan and report back."],
  ["Multi-device Sync", "A continuous NovaMind experience across devices."],
  ["Advanced Personalization", "Deeper memory, behavior, and adaptation."]
] as const;

const reasons = [
  "Faster than generic assistants",
  "Screen-aware intelligence",
  "Clean premium UI",
  "Privacy-focused direction",
  "Automation-first product design"
] as const;

const faqs = [
  ["What is NovaMind AI?", "NovaMind AI is a premium assistant designed to feel like your second brain for work, learning, and execution."],
  ["When will it be available?", "The public site is live now while the product continues toward a broader release."],
  ["Is it free?", "The plan is to make the product accessible first, then expand into premium capability tiers."],
  ["How is it different?", "NovaMind aims to combine memory, screen understanding, voice, and automation in one cleaner experience."]
] as const;

const downloadOptions = [
  ["Desktop", "Windows / macOS"],
  ["App Store", "iPhone & iPad"],
  ["Google Play", "Android"]
] as const;

const investorSignals: { icon: LucideIcon; label: string }[] = [
  { icon: Rocket, label: "High upside" },
  { icon: Globe, label: "Global demand" },
  { icon: ShieldCheck, label: "Strong direction" }
];

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? window.scrollY / height : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

function useCursorGlow() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const apply = () => {
      frame = 0;
      document.documentElement.style.setProperty("--cursor-x", `${x}px`);
      document.documentElement.style.setProperty("--cursor-y", `${y}px`);
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    apply();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}

function Reveal({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("section-reveal", visible && "is-visible", className)}
      style={{ ["--reveal-delay" as string]: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Intro({
  eyebrow,
  title,
  text,
  center = false
}: {
  eyebrow: string;
  title: string;
  text: string;
  center?: boolean;
}) {
  return (
    <div className={cn("space-y-4", center && "mx-auto max-w-3xl text-center")}>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-100/80">
        <Sparkles className="h-3.5 w-3.5 text-sky-300" />
        {eyebrow}
      </div>
      <h2 className="text-balance font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{text}</p>
    </div>
  );
}

export function LandingPage() {
  const progress = useScrollProgress();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useCursorGlow();

  return (
    <div className="landing-shell relative min-h-screen overflow-hidden bg-[#060816] text-white">
      <div className="site-progress" aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="site-cursor-glow" aria-hidden />
      <div className="landing-noise" aria-hidden />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.18),_transparent_22%),linear-gradient(180deg,_rgba(6,8,22,0.97),_rgba(4,6,18,1))]" />
        <div className="absolute inset-0 hero-grid opacity-80" />
        <div className="absolute left-[10%] top-[8%] h-64 w-64 rounded-full bg-sky-400/14 blur-[120px] animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full bg-fuchsia-500/14 blur-[140px] animate-[float_16s_ease-in-out_infinite_reverse]" />
      </div>

      <header className="fixed inset-x-0 top-4 z-40 px-3 sm:px-6">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-slate-950/55 px-4 py-3 shadow-[0_24px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <img src={logoUrl} alt="NovaMind AI" className="h-11 w-11 rounded-2xl border border-white/10 object-cover" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-sky-200/75">NovaMind AI</div>
              <div className="font-heading text-sm font-semibold text-white sm:text-base">Your second brain</div>
            </div>
          </a>

          <div className="hidden items-center gap-5 lg:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="nav-link text-sm text-slate-300 transition hover:text-white">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a href="#features" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Learn More
            </a>
            <a href="#investors" className={buttonVariants({ size: "sm" })}>
              Become an Investor
            </a>
          </div>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        <section className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-6xl items-center gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Reveal className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-100/80">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Premium AI startup for the future of work
              </div>
              <div className="space-y-6">
                <h1 className="text-balance font-heading text-5xl font-semibold leading-[0.95] text-white sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
                  Your Second Brain
                  <span className="text-gradient mt-2 block">Powered by AI</span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  NovaMind AI is building an intelligent layer that understands your screen, listens to your voice, remembers context, and helps you move faster with elegant automation.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#features" className={buttonVariants({ size: "lg" })}>
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#about" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Learn More
                </a>
              </div>
              <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
                {[
                  ["Screen-aware", "Live visual context"],
                  ["Memory-backed", "Longer continuity"],
                  ["Automation-first", "More leverage"]
                ].map(([label, value], index) => (
                  <Reveal key={label} delay={120 + index * 70} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                    <div className="mt-3 text-sm font-medium text-white">{value}</div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="relative">
              <div className="glass-panel overflow-hidden p-4 sm:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="NovaMind AI" className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
                    <div>
                      <div className="font-heading text-lg font-semibold text-white">NovaMind Interface</div>
                      <div className="text-sm text-slate-400">Clean, fast, context-rich assistance</div>
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                    Live concept
                  </div>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {["Screen help", "Voice flow", "Memory layer"].map((item) => (
                      <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                    <div className="rounded-[24px] border border-sky-400/20 bg-sky-400/10 p-4 text-sm leading-7 text-sky-50">
                      A calmer AI product built to feel premium, capable, and always useful.
                    </div>
                  </div>
                  <div className="rounded-[30px] border border-white/10 bg-[#090d1d]/85 p-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Session</div>
                          <div className="mt-1 text-sm text-white">One workspace for intelligence and action</div>
                        </div>
                        <div className="thinking-dots" aria-hidden><span /><span /><span /></div>
                      </div>
                      <div className="mt-5 space-y-3">
                        <div className="ml-auto max-w-[78%] rounded-[24px] border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-white">
                          Explain the issue, keep my context, and help me fix it.
                        </div>
                        <div className="max-w-[88%] rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-slate-200">
                          NovaMind combines chat, voice, screen understanding, and memory so every next step feels faster.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="about" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
            <Reveal>
              <Intro
                eyebrow="About NovaMind"
                title="A modern AI startup built around intelligence, productivity, and future vision."
                text="NovaMind AI is being designed as a single AI layer for thinking, doing, and automating. The goal is simple: reduce digital friction and turn intelligence into daily leverage."
              />
            </Reveal>
            <Reveal delay={100} className="grid gap-4 sm:grid-cols-2">
              {[
                ["AI-powered assistant", "A product direction centered on useful, action-ready intelligence."],
                ["Productivity engine", "Built to speed up the path from idea to execution."],
                ["Future-ready vision", "Memory, agents, sync, and advanced automation over time."],
                ["Clear by design", "Minimal layout, premium motion, and startup-level polish."]
              ].map(([title, text], index) => (
                <Reveal key={title} delay={index * 70} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
                </Reveal>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            <Reveal><Intro eyebrow="Core Features" title="Powerful capabilities that still feel simple and futuristic." text="Each feature is aimed at a clean, high-conversion message: NovaMind helps you understand more, move faster, and automate the repetitive parts." center /></Reveal>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={index * 45} className="feature-card rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-br from-sky-400/25 via-white/[0.08] to-fuchsia-500/20 text-sky-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{feature.text}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <Reveal>
              <Intro
                eyebrow="Coming Soon"
                title="The roadmap is already bigger than the first release."
                text="NovaMind AI is growing toward agents, sync, and deeper personalization. The near future is about making the assistant feel even more continuous and more powerful."
              />
            </Reveal>
            <div className="grid gap-4 lg:grid-cols-3">
              {upcoming.map(([title, text], index) => (
                <Reveal key={title} delay={index * 70} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-fuchsia-100">
                    Coming Soon
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="download" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_26%),radial-gradient(circle_at_85%_15%,_rgba(168,85,247,0.16),_transparent_20%)]" />
                <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-amber-100">
                      Currently Unavailable
                    </div>
                    <h2 className="text-balance font-heading text-3xl font-semibold text-white sm:text-4xl">
                      Download channels are designed now. Public launch is coming next.
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                      Desktop and mobile releases are planned, but the buttons stay visually disabled until launch. The product direction stays visible without pretending availability.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {downloadOptions.map(([label, detail], index) => (
                      <Reveal key={label} delay={index * 70} className="rounded-[28px] border border-white/10 bg-black/25 p-5 opacity-90">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sky-200">
                          <Download className="h-5 w-5" />
                        </div>
                        <div className="mt-5 text-lg font-semibold text-white">{label}</div>
                        <div className="mt-1 text-sm text-slate-400">{detail}</div>
                        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                          Coming Soon
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <Reveal>
              <Intro
                eyebrow="Why Choose Us"
                title="Built for people who want leverage, not just answers."
                text="NovaMind AI is aimed at users who care about speed, clarity, smarter interfaces, and AI that actually reduces friction in daily work."
              />
            </Reveal>
            <div className="grid gap-4 lg:grid-cols-5">
              {reasons.map((reason, index) => (
                <Reveal key={reason} delay={index * 55} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-200">
                    {index === 0 && <Zap className="h-5 w-5" />}
                    {index === 1 && <BrainCircuit className="h-5 w-5" />}
                    {index === 2 && <Sparkles className="h-5 w-5" />}
                    {index === 3 && <ShieldCheck className="h-5 w-5" />}
                    {index === 4 && <Workflow className="h-5 w-5" />}
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{reason}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-10">
            <Reveal>
              <Intro
                eyebrow="FAQ"
                title="Simple answers to the first questions people usually ask."
                text="The ambition is large, but the message stays simple: NovaMind AI is being built to feel useful immediately and more valuable over time."
                center
              />
            </Reveal>
            <div className="space-y-4">
              {faqs.map(([question, answer], index) => (
                <Reveal key={question} delay={index * 60}>
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    >
                      <span className="text-base font-medium text-white sm:text-lg">{question}</span>
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition duration-300", openFaq === index && "rotate-180 border-sky-400/30 bg-sky-400/10 text-sky-100")}>
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>
                    <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-60")}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-7 text-slate-300 sm:px-6">{answer}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <Reveal>
              <article className="glass-panel overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="relative min-h-[320px] bg-slate-950">
                    <img src={founderPhotoUrl} alt="Davut Baran Ekinci" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 to-transparent" />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Founder</div>
                    <h2 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">Davut Baran Ekinci</h2>
                    <div className="mt-3 inline-flex w-fit rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-100">
                      Founder & Creator
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-300">
                      NovaMind AI began with one belief: software should feel more alive, more useful, and more aligned with the way ambitious people actually think and build.
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>

            <div className="grid gap-6">
              <Reveal delay={80}>
                <article id="contact" className="glass-panel p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Contact</div>
                  <h2 className="mt-3 font-heading text-3xl font-semibold text-white">Stay close to the build.</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Follow NovaMind AI for updates, launches, partnerships, and future product drops.
                  </p>
                  <div className="mt-6 space-y-3">
                    <a href="https://www.instagram.com/novamindai_tr/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.06]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                          <Instagram className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Instagram</div>
                          <div className="text-sm text-slate-400">@novamindai_tr</div>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-slate-400" />
                    </a>
                    <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Email</div>
                          <div className="text-sm text-slate-400">contact@novamind.ai</div>
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                        Placeholder
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={130}>
                <article id="investors" className="glass-panel p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Sponsors / Investors</div>
                  <h2 className="mt-3 font-heading text-3xl font-semibold text-white">
                    We are looking for investors who believe AI should become a daily operating layer.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    NovaMind AI sits between assistant software, memory systems, automation, and premium product design. It is an early-stage bet on how personal computing will evolve.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {investorSignals.map(({ icon: ItemIcon, label }) => {
                      return (
                        <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-200">
                            <ItemIcon className="h-5 w-5" />
                          </div>
                          <div className="mt-4 text-base font-semibold text-white">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <a href="mailto:investors@novamind.ai?subject=NovaMind%20AI%20Investor%20Inquiry" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex")}>
                    Become an Investor
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-heading text-lg font-semibold text-white">NovaMind AI</div>
            <div className="mt-1 text-sm text-slate-400">© 2026 NovaMind AI. Built for a future where intelligence feels native.</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">
                {label}
              </a>
            ))}
            <a href="https://www.instagram.com/novamindai_tr/" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
