import { Code, TerminalSquare, Wrench } from "lucide-react";
import { ChatWorkspace } from "../components/ChatWorkspace";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { AppSettings, Conversation } from "../types/app";

interface CodeAssistantPageProps {
  conversation: Conversation | null;
  settings: AppSettings;
  isSending: boolean;
  speakingMessageId: string | null;
  onSend: (value: string) => Promise<boolean>;
  onNewConversation: () => void;
  onSpeak: (messageId: string, text: string) => void;
}

export function CodeAssistantPage(props: CodeAssistantPageProps) {
  return (
    <ChatWorkspace
      {...props}
      title="Developer mode for generation, debugging, and review."
      subtitle="NovaMind shifts into implementation-focused behavior here. Use it to generate code, explain existing snippets, diagnose failures, or reason through architecture with syntax-highlighted responses."
      insights={[
        { label: "Prompt Pattern", value: "Paste code, include the error, and ask for a patch or explanation." },
        { label: "Best Command", value: "Use /code to bias answers toward concrete implementation." },
        { label: "Output", value: "Markdown + syntax highlighting keeps code blocks readable." }
      ]}
      emptyTitle="Ship code with NovaMind"
      emptyDescription="Drop in a stack trace, a function, or a design problem. The assistant is tuned here for pragmatic coding help."
      hero={
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5 text-primary" />
                Generate
              </CardTitle>
              <CardDescription>Scaffold components, routes, API handlers, and utilities.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>/code generate a reusable React table with sorting</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5 text-primary" />
                Debug
              </CardTitle>
              <CardDescription>Interpret logs, isolate the likely cause, and suggest fixes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>Explain why this async function is hanging</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TerminalSquare className="h-5 w-5 text-primary" />
                Explain
              </CardTitle>
              <CardDescription>Walk through unfamiliar code without losing important detail.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>/explain this Rust ownership error</Badge>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
