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
  Linkedin,
  Mail,
  Menu,
  MessageSquareText,
  Mic,
  MonitorSmartphone,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import founderPhotoUrl from "../../davutbaran.jpeg";
import logoUrl from "../../logo.png";
import { landingContent, type LandingLanguage } from "../lib/landing-content";
import { cn } from "../lib/utils";
import { buttonVariants } from "./ui/button";

const STORAGE_KEY = "novamind-landing-language";
const INSTAGRAM_URL = "https://www.instagram.com/novamindai_tr/";
const LINKEDIN_URL = "https://www.linkedin.com/in/davut-baran-ekinci-911417334/";
const EMAIL_ADDRESS = "baranekinciofficial@gmail.com";

const featureIcons: LucideIcon[] = [
  MessageSquareText,
  ScanSearch,
  Mic,
  BrainCircuit,
  Bot,
  WandSparkles,
  Command,
  Workflow,
  Code2,
  Zap
];

const reasonIcons: LucideIcon[] = [Zap, BrainCircuit, Sparkles, ShieldCheck, Workflow];
const investorIcons: LucideIcon[] = [Rocket, Globe, ShieldCheck];

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
  const [language, setLanguage] = useState<LandingLanguage>("en");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);
  useCursorGlow();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    const copy = landingContent[language];
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.title = copy.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", copy.meta.description);
  }, [language]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : previousOverflow;
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const copy = landingContent[language];
  const navItems = [
    [copy.nav.about, "#about"],
    [copy.nav.features, "#features"],
    [copy.nav.faq, "#faq"],
    [copy.nav.contact, "#contact"]
  ] as const;
  const languageOptions = [
    ["en", copy.language.english],
    ["tr", copy.language.turkish]
  ] as const;
  const mobileMenuLabel = language === "en" ? "Open navigation menu" : "Gezinme menüsünü aç";

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
        <div className="mx-auto w-full max-w-6xl">
          <nav className="flex w-full items-center justify-between rounded-full border border-white/10 bg-slate-950/55 px-4 py-3 shadow-[0_24px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <img src={logoUrl} alt="NovaMind AI" className="h-11 w-11 rounded-2xl border border-white/10 object-cover" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.28em] text-sky-200/75">NovaMind AI</div>
              <div className="truncate font-heading text-sm font-semibold text-white sm:text-base">
                {copy.hero.title}
              </div>
            </div>
          </a>

          <div className="hidden items-center gap-5 lg:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="nav-link text-sm text-slate-300 transition hover:text-white">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div ref={languageRef} className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((current) => !current)}
                className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 transition hover:border-sky-400/25 hover:bg-white/[0.06]"
                aria-label={copy.language.label}
                aria-expanded={languageOpen}
              >
                <Globe className="h-4 w-4 text-sky-300" />
                <span className="hidden sm:inline">
                  {language === "en" ? copy.language.english : copy.language.turkish}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition duration-300", languageOpen && "rotate-180")} />
              </button>

              <div
                className={cn(
                  "absolute right-0 top-[calc(100%+0.75rem)] w-44 rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-[0_24px_80px_rgba(2,6,23,0.48)] backdrop-blur-2xl transition duration-300",
                  languageOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-2 opacity-0"
                )}
              >
                {languageOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLanguage(value);
                      setLanguageOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition duration-200",
                      language === value
                        ? "bg-sky-400/12 text-white"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <span>{label}</span>
                    {language === value ? <span className="h-2 w-2 rounded-full bg-sky-300" /> : null}
                  </button>
                ))}
              </div>
            </div>

            <a href="#features" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {copy.actions.learnMore}
            </a>
            <a href="#investors" className={buttonVariants({ size: "sm" })}>
              {copy.actions.becomeInvestor}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 transition hover:border-sky-400/25 hover:bg-white/[0.06] lg:hidden"
            aria-label={mobileMenuLabel}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          </nav>
          <div
            className={cn(
              "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
              mobileMenuOpen
                ? "pointer-events-auto mt-3 max-h-[calc(100svh-5.5rem)] opacity-100"
                : "pointer-events-none max-h-0 opacity-0"
            )}
          >
            <div className="glass-panel max-h-[calc(100svh-6rem)] overflow-y-auto rounded-[32px] p-4 sm:p-5">
            <div className="grid gap-2">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-slate-100 transition hover:border-sky-400/25 hover:bg-white/[0.06]"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                <Globe className="h-4 w-4 text-sky-300" />
                {copy.language.label}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {languageOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLanguage(value);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm transition duration-200",
                      language === value
                        ? "border-sky-400/30 bg-sky-400/12 text-white"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-sky-400/25 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}
              >
                {copy.actions.learnMore}
              </a>
              <a
                href="#investors"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                {copy.actions.becomeInvestor}
              </a>
            </div>
            </div>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        <section className="px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
          <div className="mx-auto grid min-h-[calc(100svh-6.5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
            <Reveal className="space-y-8 text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.28em] text-sky-100/80 lg:mx-0">
                <Sparkles className="h-4 w-4 text-sky-300" />
                {copy.hero.badge}
              </div>
              <div className="space-y-6">
                <h1 className="text-balance font-heading text-[2.85rem] font-semibold leading-[0.96] text-white sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
                  {copy.hero.title}
                  <span className="text-gradient mt-2 block">{copy.hero.titleAccent}</span>
                </h1>
                <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 lg:mx-0">
                  {copy.hero.description}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a href="#features" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                  {copy.actions.getStarted}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#about" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}>
                  {copy.actions.learnMore}
                </a>
              </div>
              <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-3 lg:mx-0">
                {copy.hero.stats.map((item, index) => (
                  <Reveal key={item.label} delay={120 + index * 70} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                    <div className="mt-3 text-sm font-medium text-white">{item.value}</div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="relative">
              <div className="glass-panel overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={logoUrl} alt="NovaMind AI" className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
                    <div className="min-w-0">
                      <div className="truncate font-heading text-lg font-semibold text-white">{copy.hero.preview.title}</div>
                      <div className="text-sm text-slate-400">{copy.hero.preview.subtitle}</div>
                    </div>
                  </div>
                  <div className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                    {copy.hero.preview.status}
                  </div>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {copy.hero.preview.chips.map((item) => (
                      <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                    <div className="rounded-[24px] border border-sky-400/20 bg-sky-400/10 p-4 text-sm leading-7 text-sky-50">
                      {copy.hero.preview.note}
                    </div>
                  </div>
                  <div className="rounded-[30px] border border-white/10 bg-[#090d1d]/85 p-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{copy.hero.preview.sessionLabel}</div>
                          <div className="mt-1 text-sm text-white">{copy.hero.preview.sessionTitle}</div>
                        </div>
                        <div className="thinking-dots" aria-hidden><span /><span /><span /></div>
                      </div>
                      <div className="mt-5 space-y-3">
                        <div className="ml-auto max-w-[78%] rounded-[24px] border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-white">
                          {copy.hero.preview.userMessage}
                        </div>
                        <div className="max-w-[88%] rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-slate-200">
                          {copy.hero.preview.assistantMessage}
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
                eyebrow={copy.about.eyebrow}
                title={copy.about.title}
                text={copy.about.description}
              />
            </Reveal>
            <Reveal delay={100} className="grid gap-4 sm:grid-cols-2">
              {copy.about.cards.map((item, index) => (
                <Reveal key={item.title} delay={index * 70} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
                </Reveal>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <Reveal>
              <Intro eyebrow={copy.vision.eyebrow} title={copy.vision.title} text={copy.vision.description} />
            </Reveal>
            <div className="grid gap-4 lg:grid-cols-3">
              {copy.vision.cards.map((item, index) => (
                <Reveal key={item.title} delay={index * 70} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-5 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-100">
                    {item.title}
                  </div>
                  <p className="text-sm leading-7 text-slate-300">{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            <Reveal><Intro eyebrow={copy.features.eyebrow} title={copy.features.title} text={copy.features.description} center /></Reveal>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {copy.features.items.map((feature, index) => {
                const Icon = featureIcons[index];
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
                eyebrow={copy.upcoming.eyebrow}
                title={copy.upcoming.title}
                text={copy.upcoming.description}
              />
            </Reveal>
            <div className="grid gap-4 lg:grid-cols-3">
              {copy.upcoming.items.map((item, index) => (
                <Reveal key={item.title} delay={index * 70} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-fuchsia-100">
                    {copy.actions.comingSoon}
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
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
                      {copy.actions.currentlyUnavailable}
                    </div>
                    <h2 className="text-balance font-heading text-3xl font-semibold text-white sm:text-4xl">
                      {copy.download.title}
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                      {copy.download.description}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {copy.download.options.map((option, index) => (
                      <Reveal key={option.label} delay={index * 70} className="rounded-[28px] border border-white/10 bg-black/25 p-5 opacity-90">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sky-200">
                          <Download className="h-5 w-5" />
                        </div>
                        <div className="mt-5 text-lg font-semibold text-white">{option.label}</div>
                        <div className="mt-1 text-sm text-slate-400">{option.detail}</div>
                        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                          {copy.actions.comingSoon}
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
                eyebrow={copy.whyChoose.eyebrow}
                title={copy.whyChoose.title}
                text={copy.whyChoose.description}
              />
            </Reveal>
            <div className="grid gap-4 lg:grid-cols-5">
              {copy.whyChoose.reasons.map((reason, index) => {
                const Icon = reasonIcons[index];
                return (
                <Reveal key={reason} delay={index * 55} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{reason}</p>
                </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-10">
            <Reveal>
              <Intro
                eyebrow={copy.faq.eyebrow}
                title={copy.faq.title}
                text={copy.faq.description}
                center
              />
            </Reveal>
            <div className="space-y-4">
              {copy.faq.items.map((item, index) => (
                <Reveal key={item.question} delay={index * 60}>
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    >
                      <span className="text-base font-medium text-white sm:text-lg">{item.question}</span>
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition duration-300", openFaq === index && "rotate-180 border-sky-400/30 bg-sky-400/10 text-sky-100")}>
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>
                    <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-60")}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-7 text-slate-300 sm:px-6">{item.answer}</p>
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
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{copy.founder.eyebrow}</div>
                    <h2 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">Davut Baran Ekinci</h2>
                    <div className="mt-3 inline-flex w-fit rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-100">
                      {copy.founder.role}
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-300">
                      {copy.founder.story}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>

            <div className="grid gap-6">
              <Reveal delay={80}>
                <article id="contact" className="glass-panel p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{copy.contact.eyebrow}</div>
                  <h2 className="mt-3 font-heading text-3xl font-semibold text-white">{copy.contact.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{copy.contact.description}</p>
                  <div className="mt-6 space-y-3">
                    <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                          <Instagram className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{copy.contact.instagram}</div>
                          <div className="text-sm text-slate-400">@novamindai_tr</div>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-slate-400" />
                    </a>

                    <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                          <Linkedin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{copy.contact.linkedin}</div>
                          <div className="text-sm text-slate-400">Davut Baran Ekinci</div>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-slate-400" />
                    </a>

                    <a href={`mailto:${EMAIL_ADDRESS}`} className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{copy.contact.email}</div>
                          <div className="text-sm text-slate-400">{EMAIL_ADDRESS}</div>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-slate-400" />
                    </a>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={130}>
                <article id="investors" className="glass-panel p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{copy.investors.eyebrow}</div>
                  <h2 className="mt-3 font-heading text-3xl font-semibold text-white">{copy.investors.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{copy.investors.description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {copy.investors.signals.map((label, index) => {
                      const ItemIcon = investorIcons[index];
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
                  <a href={`mailto:${EMAIL_ADDRESS}?subject=NovaMind%20AI%20Investor%20Inquiry`} className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex")}>
                    {copy.actions.becomeInvestor}
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
            <div className="mt-1 text-sm text-slate-400">{copy.footer.copyright}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">
                {label}
              </a>
            ))}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
              <Instagram className="h-4 w-4" />
              {copy.footer.instagram}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
