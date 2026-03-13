import { CheckCircle2, LoaderCircle, PlugZap, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { pluginRegistry } from "../plugins/builtin";
import { getHealth } from "../services/speech";
import type { AppSettings } from "../types/app";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

interface SettingsPageProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export function SettingsPage({ settings, onChange }: SettingsPageProps) {
  const [health, setHealth] = useState<{
    ok: boolean;
    hasOpenAIKey: boolean;
    supportedDocumentTypes: string[];
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      setStatus("loading");
      setError(null);

      try {
        const result = await getHealth(settings.apiBaseUrl);
        if (active) {
          setHealth(result);
        }
      } catch (innerError) {
        if (active) {
          setError(innerError instanceof Error ? innerError.message : "Unable to reach backend.");
        }
      } finally {
        if (active) {
          setStatus("idle");
        }
      }
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, [settings.apiBaseUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">Configuration</Badge>
            <Badge>Auto-saved locally</Badge>
          </div>
          <h2 className="font-heading text-3xl font-semibold">Tune NovaMind for your workflow.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Configure the backend URL, default chat model, temperature, voice behavior, and extra system guidance. Settings persist in local storage for the desktop app.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              Backend Status
            </CardTitle>
            <CardDescription>Checks the local Express API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {status === "loading" ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Contacting backend...
              </div>
            ) : null}
            {health ? (
              <>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  API reachable at {settings.apiBaseUrl}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-muted-foreground">
                  OpenAI key configured: {health.hasOpenAIKey ? "yes" : "no"}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-muted-foreground">
                  Supported docs: {health.supportedDocumentTypes.join(", ")}
                </div>
              </>
            ) : null}
            {error ? <div className="text-red-300">{error}</div> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API & Model</CardTitle>
              <CardDescription>Control how the frontend talks to the local backend.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">API base URL</label>
                <Input
                  value={settings.apiBaseUrl}
                  onChange={(event) => onChange({ ...settings, apiBaseUrl: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Default model</label>
                <select
                  value={settings.defaultModel}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      defaultModel: event.target.value as AppSettings["defaultModel"]
                    })
                  }
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Temperature: {settings.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(event) =>
                    onChange({ ...settings, temperature: Number(event.target.value) })
                  }
                  className="w-full accent-teal-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">TTS voice</label>
                <select
                  value={settings.voiceName}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      voiceName: event.target.value as AppSettings["voiceName"]
                    })
                  }
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="alloy">alloy</option>
                  <option value="echo">echo</option>
                  <option value="fable">fable</option>
                  <option value="onyx">onyx</option>
                  <option value="nova">nova</option>
                  <option value="shimmer">shimmer</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
              <CardDescription>Fine-tune the assistant and voice defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span>
                  <div className="text-sm font-medium text-foreground">Auto-speak in voice mode</div>
                  <div className="text-sm text-muted-foreground">
                    Speak new assistant answers automatically in Voice Mode.
                  </div>
                </span>
                <input
                  type="checkbox"
                  checked={settings.voiceAutoSpeak}
                  onChange={(event) =>
                    onChange({ ...settings, voiceAutoSpeak: event.target.checked })
                  }
                  className="h-5 w-5 accent-teal-400"
                />
              </label>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Optional system prompt
                </label>
                <Textarea
                  value={settings.systemPrompt}
                  onChange={(event) => onChange({ ...settings, systemPrompt: event.target.value })}
                  placeholder="Example: Prefer structured answers with action items and no fluff."
                  className="min-h-[160px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="h-5 w-5 text-primary" />
              Plugin Architecture
            </CardTitle>
            <CardDescription>
              Built-in registry for future integrations. These are placeholders in the MVP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pluginRegistry.list().map((plugin) => (
              <div
                key={plugin.id}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="font-medium text-foreground">{plugin.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{plugin.description}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plugin.commands.map((command) => (
                    <Badge key={command}>{command}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
