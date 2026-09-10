let DEBUG  =  false
export const log = {
  user: (t: string) => console.log(`\n🧑 : ${t}`),
  jarvis: (t: string) => console.log(`🤖 : ${t}\n`),
  mic: (t: string) => console.log(`🎤 ${t}`),
  tool: (name: string) => console.log(`🔧 ${name}`),
  debug: (label: string, data?: unknown) =>
    DEBUG && console.log(`   ${label}`, data ?? ""),
  error: (e: unknown) => console.log(`❌ ${e instanceof Error ? e.message : e}`),
}