import { ChildProcess, spawn } from "child_process";
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROK_API_KEY });
import fs from "fs";
import { log } from "./log.js";
import { checkUserActivity, timeoutThreshold } from "../index.js";
export const sendToWhisper = async (fileName: string): Promise<string> => {
  try {
    console.log("file", fileName);
    const res = await groq.audio.transcriptions.create({
      file: fs.createReadStream(fileName),
      model: "whisper-large-v3-turbo",
    });
    return res.text;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


export const listen = (): { promise: Promise<string>, cancel: () => void ,idle:Promise<{type:"idle",time:number}> } => {
  let ffmpeg: ChildProcess
  let cancelled = false

  let idleTimer: NodeJS.Timeout
  let onIdle: () => void  
   const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => onIdle(), timeoutThreshold)
  }
  const onKey = () => {
    console.log("stopped , transcribing...")
    ffmpeg?.stdin?.write("q")
  }

  const idle = new Promise<{type:"idle",time:number}>(res => {
  onIdle = () => res({type:"idle", time: timeoutThreshold/1000})
})
resetIdle() 

  const promise = new Promise<string>((resolve, reject) => {
    log.mic("listening... (press any key to stop)")

    ffmpeg = spawn("ffmpeg", [
      "-f", "dshow",
      "-i", "audio=Headset (OnePlus Nord Buds 3r)",
      "-ar", "16000",
      "-ac", "1",
      "-af", "ebur128=peak=true",
      "-y", "temp.wav",
    ])

    ffmpeg.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      if (text.includes("Error") || text.includes("Unrecognized")) console.log(text)
      const match = text.match(/M:\s*(-?\d+\.?\d*)/)
      if (match) {
        const db = parseFloat(match[1])
        if (db < -110) return
        const level = Math.max(0, Math.min(10, Math.round((db + 90) / 10)))
        getMicVolumes(level)
      if (level > 3) resetIdle()
      }
    })

    process.stdin.read()
    process.stdin.once("data", onKey)

    ffmpeg.on("close", async () => {
      process.stdin.removeListener("data", onKey)
      if (cancelled) return
      const text = await sendToWhisper("temp.wav")
      log.user(text)
      resolve(text)
    })

    ffmpeg.on("error", (err) => {
      process.stdin.removeListener("data", onKey)
      reject(err)
    })
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      process.stdin.removeListener("data", onKey)
      ffmpeg?.kill()
    },
    idle,
  }
}






const cols = process.stdout.columns;
const rows = process.stdout.rows;


const getMicVolumes = (level: number) => {
  const bar = "■".repeat(level) + "□".repeat(10 - level);
  process.stdout.write(`\x1b[s`);
  process.stdout.write(`\x1b[${rows};${cols - 150}H`);
  process.stdout.write(`🎤 ${bar} ${level}`);
  process.stdout.write(`\x1b[u`);
};
