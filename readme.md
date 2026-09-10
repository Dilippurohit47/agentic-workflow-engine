# agentic-workflow-engine

A voice-driven AI agent with persistent memory and an autonomous task scheduler.

Talk to it, and it uses tools to get things done — check the weather, look something up in its memory, open an app, send a message. Ask it to do something later, and a separate pool of worker processes picks that task up and executes it on its own, with no conversation and nobody watching.

---

## What it does

**Conversational agent (local)**
Speak or type. The agent decides which tools to call, chains them together, and answers. Voice in via Whisper, voice out via streaming TTS, with a live audio meter and silence-based auto-stop.

**Long-term memory**
Facts about you are embedded and stored in Postgres with pgvector. The agent decides on its own when to save something and when to look something up — retrieval is a tool it calls, not a step that always runs.

**Autonomous task execution**
Schedule work for later. Worker processes poll a Postgres-backed queue, claim tasks safely, and run them through a restricted agent with its own system prompt and a smaller tool set. Results are delivered over Telegram.

---

## Architecture

```
┌─────────────────┐
│   CLI (local)   │  voice + text, full tool access
│  mic → Whisper  │
│  TTS → speaker  │
└────────┬────────┘
         │ schedules tasks
         ▼
┌─────────────────────────────┐
│      PostgreSQL             │
│  ┌───────────┐ ┌──────────┐ │
│  │   Task    │ │LlmMemory │ │
│  │TaskRun    │ │(pgvector)│ │
│  └───────────┘ └──────────┘ │
└────────┬────────────────────┘
         │ claim + execute
         ▼
┌─────────────────────────────┐
│  Worker × N  (containerised)│
│  restricted prompt + tools  │
│  → Telegram                 │
└─────────────────────────────┘
```

The CLI and the workers share the same agent loop and tool registry, but not the same system prompt or the same capabilities. The CLI can ask you questions; the worker can't, so it fails loudly instead of guessing.

---

## Engineering notes

The interesting parts aren't the tool calls — they're what happens when things go wrong.

**Safe concurrency.** Multiple workers poll the same queue. Claiming uses `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction, so two workers can never claim the same task. Workers that arrive a moment later skip the locked rows and take different work instead of blocking.

**At-least-once delivery, made safe.** A worker can crash between "message sent" and "task marked complete." That's unavoidable — the side effect and the database write are two separate systems. So every run gets a `TaskRun` record keyed on `(taskId, runAt)`, written in the same transaction as the claim, moving `ATTEMPTED → CONFIRMED` only after the work succeeds. A re-run reads that record and knows whether to skip.

**Crash recovery.** Tasks claimed but never finished are released back to the queue after a staleness threshold, so a dead worker doesn't strand its work.

**Bounded retries.** Failures increment an attempt counter and store the error. Three strikes and the task is marked failed rather than retried forever.

**Graceful shutdown.** On `SIGTERM`/`SIGINT`, the worker stops claiming new tasks, lets the current one finish, releases anything still held, then exits. Deploys don't strand in-flight work.

**Validation over prompting.** Models invent plausible-looking arguments — a phone number that matches the example in the schema, a timestamp from the wrong year, a placeholder where a lookup should have happened. Where correctness matters, the tool rejects bad input and tells the model what to do instead, rather than relying on the system prompt to have covered it.

**Tuned retrieval.** The vector search uses a cosine distance cutoff chosen by measuring where relevant results stopped and noise began, rather than a guessed default. Without it, a query about one thing returns the ten least-bad matches and the model answers from whichever it likes.

---

## Tools

| Tool | What it does |
|---|---|
| `searchInMemory` | Vector search over stored facts |
| `saveInMemory` | Store a new fact |
| `getWeatherTool` | Current weather for a place |
| `scheduleTask` | Queue work for later |
| `getTasks` | List scheduled tasks |
| `sendTelegramMessage` | Deliver a message |
| `playYouTube` | Search and play a video |
| `openAnyApp` | Launch a desktop app |
| `focusWindow` | Bring a window to the foreground |
| `listOpenWindows` | Enumerate open windows |
| `getActiveWindow` | Which window has focus |
| `pressKey` | Send a keystroke |
| `sendMessageOnWhatsApp` | Pre-fill a WhatsApp message |
| `changeInputMode` | Switch between voice and text |

Workers get a subset — no desktop control, no memory writes, no scheduling. A background process shouldn't be pressing keys on your machine.

---

## Setup

**Requirements:** Node 22+, Docker, ffmpeg (for voice)

```bash
git clone <repo>
cd jarvis-runtime
npm install
cp .env.example .env    # fill in your keys
```

Start the database and apply migrations:

```bash
docker compose up -d postgres
npx prisma migrate deploy
```

Run the CLI:

```bash
npm run dev
```

Run workers:

```bash
docker compose up --scale worker=3
```

### Environment

```
DATABASE_URL=postgresql://postgres:password@localhost:5435/jarvis
OPENAI_API_KEY=
GROK_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
WEATHER_API_KEY=
```

---

## Structure

```
src/
  index.ts          CLI entry point
  agent.ts          the tool-calling loop, shared by both
  llm.ts            model client
  constants.ts      prompts, tool schemas, tool registry
  tools/            one file per capability
  lib/              speak, listen, logging, embeddings
  worker/           polling loop, claiming, execution
prisma/
  schema.prisma
```

Two entry points, one agent. Everything else is shared.

---

## Stack

TypeScript · Node.js · PostgreSQL · pgvector · Prisma · OpenAI · Groq (Whisper + TTS) · FFmpeg · Docker

---

## Known limits

- Desktop control is Windows-only (DirectShow + PowerShell)
- Recurring tasks accept a cron expression but don't yet reschedule themselves after completion
- Retries fire immediately rather than backing off
- Workers have no health endpoint — a stuck worker looks the same as a busy one