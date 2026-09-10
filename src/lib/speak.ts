import { spawn } from "child_process";
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROK_API_KEY });


export async function speak2(text: string) {
try {
   const response = await groq.audio.speech.create({
  model: "canopylabs/orpheus-v1-english", 
  voice: "daniel",                          
  input: text,
  response_format: "wav"
})
const buffer = Buffer.from(await response.arrayBuffer())

await new Promise<void>((resolve,reject)=>{
const ffplay = spawn("ffplay", [
  "-nodisp",
  "-autoexit",
  "-"
]);

ffplay.on("close",()=>resolve())
ffplay.on("error",(e)=>reject(e))
ffplay.stdin.on("error", () => {})    
ffplay.stdin.write(buffer);
ffplay.stdin.end();
})
} catch (error) {
  console.log(error)
}
}
