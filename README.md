# NovaMind AI

NovaMind AI is a desktop MVP built with Tauri, React, TailwindCSS, and Express.

Tagline: `Your Second Brain.`

## MVP Features

- AI chat assistant with streaming responses
- Markdown rendering and syntax-highlighted code blocks
- Local chat history persistence
- Screen AI with screenshot capture and region selection
- Voice input via microphone transcription
- Voice output via OpenAI text-to-speech
- Document intelligence for PDF, TXT, DOCX, and Markdown
- Code assistant mode
- Smart slash commands
- Plugin-ready architecture

## Project Structure

```text
novamind-ai/
|- server/
|  |- index.ts
|  `- lib/
|     |- commands.ts
|     |- documents.ts
|     `- openai.ts
|- src/
|  |- components/
|  |  |- ChatWindow.tsx
|  |  |- ChatWorkspace.tsx
|  |  |- Composer.tsx
|  |  |- FileDropzone.tsx
|  |  |- MessageBubble.tsx
|  |  |- ScreenCapture.tsx
|  |  |- Sidebar.tsx
|  |  |- VoiceButton.tsx
|  |  `- ui/
|  |     |- badge.tsx
|  |     |- button.tsx
|  |     |- card.tsx
|  |     |- input.tsx
|  |     `- textarea.tsx
|  |- lib/
|  |  |- smartCommands.ts
|  |  |- storage.ts
|  |  `- utils.ts
|  |- pages/
|  |  |- Chat.tsx
|  |  |- CodeAssistant.tsx
|  |  |- Documents.tsx
|  |  |- ScreenAI.tsx
|  |  |- Settings.tsx
|  |  `- VoiceMode.tsx
|  |- plugins/
|  |  |- builtin.ts
|  |  |- registry.ts
|  |  `- types.ts
|  |- services/
|  |  |- ai.ts
|  |  |- api.ts
|  |  |- screen.ts
|  |  `- speech.ts
|  |- types/
|  |  `- app.ts
|  |- App.tsx
|  |- index.css
|  `- main.tsx
|- src-tauri/
|  |- src/
|  |  |- lib.rs
|  |  `- main.rs
|  |- Cargo.toml
|  `- tauri.conf.json
|- .env.example
|- package.json
`- README.md
```

## Environment Setup

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8787
VITE_API_BASE_URL=http://127.0.0.1:8787
```

The server reads environment values from `.env.local`, `.env`, and then `.env.example` in that order. For local development, use `.env` or `.env.local`.

## Install Dependencies

```bash
npm install
```

You also need the native prerequisites for Tauri:

- Rust toolchain
- Microsoft C++ Build Tools on Windows
- WebView2 runtime on Windows

Official Tauri prerequisite guide:

https://tauri.app/start/prerequisites/

## Run Locally

Start the full desktop MVP:

```bash
npm run dev
```

This starts:

- the Express API on `http://127.0.0.1:8787`
- the Vite frontend on `http://127.0.0.1:1420`
- the Tauri desktop shell

Useful individual commands:

```bash
npm run dev:server
npm run dev:web
npm run tauri:dev
```

## Build

Build the frontend and backend:

```bash
npm run build
```

Build the Tauri desktop app:

```bash
npm run tauri:build
```

## Notes

- Screen AI uses a native Tauri screenshot command when available and falls back to browser screen sharing in a web environment.
- Conversations and settings are saved in local storage for the MVP.
- The Express API is designed for local development. Packaging the Node backend into a production sidecar would be the next step beyond this MVP.
