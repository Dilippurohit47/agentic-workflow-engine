let DEBUG  =  false

const WORKER_ID = process.env.HOSTNAME?.slice(0, 6) ?? "local"

export const log = {
  user: (t: string) => console.log(`\n🧑 : ${t}`),
  jarvis: (t: string) => console.log(`🤖 : ${t}\n`),
  mic: (t: string) => console.log(`🎤 ${t}`),
  tool: (name: string) => console.log(`🔧 ${name}`),
  debug: (label: string, data?: unknown) =>
    DEBUG && console.log(`   ${label}`, data ?? ""),
  error: (e: unknown) => console.log(`❌ ${e instanceof Error ? e.message : e}`),
  worker: (msg: string) => console.log(`[${WORKER_ID}] ${msg}`),
}