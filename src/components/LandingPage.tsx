import {
  ArrowRight,
  Download,
  FileText,
  Github,
  Mic,
  MonitorSmartphone,
  Sparkles
} from "lucide-react";
import logoUrl from "../../logo.jpeg";
import { cn } from "../lib/utils";
import { buttonVariants } from "./ui/button";

const directDownloadUrl = "/downloads/NovaMind-AI-Setup.exe";
const repositoryUrl = "https://github.com/MasterLoki0616/NovaMind-AI";

const featureCards = [
  {
    icon: MonitorSmartphone,
    eyebrow: "Screen Help",
    title: "Capture your screen the moment you get stuck.",
    description:
      "UI, code, charts, or math problems. NovaMind reads the image and gives you a fast, plain-English answer."
  },
  {
    icon: FileText,
    eyebrow: "Document Insight",
    title: "Open PDFs, DOCX files, and notes in one click.",
    description:
      "Summarize files, ask grounded questions, and pull out risks without jumping across multiple screens."
  },
  {
    icon: Mic,
    eyebrow: "Voice Input",
    title: "Start by speaking instead of typing.",
    description:
      "Record quick prompts, capture ideas, and keep your flow moving with a single voice button."
  }
];

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-60" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="NovaMind AI logo"
              className="h-12 w-12 rounded-2xl border border-white/10 object-cover shadow-[0_18px_44px_rgba(59,130,246,0.28)]"
            />
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-sky-200/75">
                Desktop-first AI
              </div>
              <div className="font-heading text-lg font-semibold text-white">NovaMind AI</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a
              href={directDownloadUrl}
              download="NovaMind-AI-Setup.exe"
              className={buttonVariants({ size: "sm" })}
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </header>

        <main className="flex flex-1 items-center py-8 lg:py-10">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-sky-100/80">
                <Sparkles className="h-4 w-4 text-sky-300" />
                A clean product site on the web, a focused AI workspace on desktop
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  NovaMind is not a browser-only demo.
                  <span className="text-gradient block">
                    It is a desktop AI companion you can download, open, and use right away.
                  </span>
                </h1>

                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  The landing page explains the product in seconds. The desktop app removes the noise
                  and keeps everything centered around chat, screen capture, file upload, and voice.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={directDownloadUrl}
                  download="NovaMind-AI-Setup.exe"
                  className={buttonVariants({ size: "lg" })}
                >
                  <Download className="h-4 w-4" />
                  Download Windows app
                </a>
                <a
                  href="#preview"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Preview the app
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <p className="text-sm text-slate-400">
                The button above downloads the installer directly as an `.exe` file.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="glass-panel px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Experience
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">One workspace</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Chat, screen, file, and voice in the same flow.
                  </div>
                </div>
                <div className="glass-panel px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Desktop</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Lightweight Tauri-based Windows installer.
                  </div>
                </div>
                <div className="glass-panel px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Speed</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Quick actions</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Open the screen tool, attach a file, speak, and keep moving.
                  </div>
                </div>
              </div>
            </section>

            <section id="preview" className="relative">
              <div className="absolute -left-12 top-10 h-32 w-32 rounded-full bg-cyan-400/18 blur-[88px]" />
              <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-fuchsia-500/18 blur-[88px]" />

              <div className="glass-panel relative overflow-hidden p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="NovaMind AI logo"
                      className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                    />
                    <div>
                      <div className="font-heading text-lg font-semibold text-white">
                        NovaMind Desktop
                      </div>
                      <div className="text-sm text-slate-400">
                        Small, fast, and focused AI workspace
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Ready
                  </div>
                </div>

                <div className="grid gap-4 pt-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Recent chats
                      </div>
                      <div className="mt-3 space-y-2">
                        {["New product landing page", "Explain this screen", "Summarize the PDF"].map(
                          (title, index) => (
                            <div
                              key={title}
                              className={cn(
                                "rounded-2xl border px-3 py-3 text-sm",
                                index === 0
                                  ? "border-sky-400/25 bg-sky-400/10 text-white"
                                  : "border-white/10 bg-black/25 text-slate-300"
                              )}
                            >
                              {title}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                      The website sells the idea. The app stays focused on getting work done.
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-black/35 p-4">
                    <div className="space-y-3">
                      <div className="ml-auto max-w-[82%] rounded-[26px] border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-sm text-white">
                        I want a desktop app instead of a browser-only experience. Give me a short
                        intro site and a downloadable chat app.
                      </div>
                      <div className="max-w-[88%] rounded-[26px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-7 text-slate-200">
                        Done. The landing page explains the value in seconds, while the app stays
                        centered on chat. Screen analysis, document uploads, and voice prompts remain
                        one click away.
                      </div>
                    </div>

                    <div className="mt-4 rounded-[26px] border border-white/10 bg-black/30 p-3">
                      <div className="mb-3 flex items-center gap-2 text-slate-400">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                          <MonitorSmartphone className="h-4 w-4" />
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                          <Mic className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-transparent px-4 py-4 text-sm text-slate-300">
                        Message NovaMind... then continue with file, screen, or voice.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <section className="pb-10 pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="glass-panel h-full p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {feature.eyebrow}
                  </div>
                  <h2 className="mt-3 font-heading text-2xl font-semibold text-white">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
