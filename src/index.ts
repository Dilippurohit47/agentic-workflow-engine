import * as readline from "readline/promises";
import dotenv from "dotenv";
import { isDatabaseActive } from "./tools/memory.js";
import { availableToolInfo, systemPrompt, availableTools } from "./contants.js";
import { listen } from "./lib/listen.js";
import { log } from "./lib/log.js";
import { inputMode } from "./state.js";
import { runAgent } from "./agent.js";

dotenv.config();



export const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


export const messages: Object[] = [...systemPrompt];

export let timeoutThreshold = 5000;

let prevTimer: ReturnType<typeof setTimeout> | undefined;

export const checkUserActivity = (): Promise<{
  type: "idle";
  time: number;
}> => {
  return new Promise((res, rej) => {
    if (prevTimer) {
      clearTimeout(prevTimer);
    }

    prevTimer = setTimeout(() => {
      res({
        type: "idle",
        time: timeoutThreshold / 1000,
      });
      prevTimer = undefined;
    }, timeoutThreshold);
  });
};

async function startConversation(){
  while (true) {
    const session = inputMode === "voice" ? listen() : null;

    let input: string | { type: "idle"; time: number } = await Promise.race([
      session ? session.promise : r1.question("you : "),
      ...(session ? [session.idle] : []),
    ]);

    if (typeof input === "object" && input.type === "idle") {
      session?.cancel();
      input = `[SYSTEM: User has been inactive for ${input.time} seconds. Sign off briefly, then call changeInputMode tool with mode "text". Also mention why are you changing mode ]`;
      log.user(input);
    }
    const reply = await runAgent(
      input,
      messages,
      availableTools,
      availableToolInfo,
    );
    log.jarvis(reply);
    // await speak2(reply); 
  }
}
log.jarvis("hello im Jarvis your ai assistant");
console.log(await isDatabaseActive());
startConversation();



