
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"
dotenv.config()
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
export const createEmbeddings = async(data:any)=>{

try {
       const response = await ai.models.embedContent({
  model: "gemini-embedding-2",
  contents: data,
});
return response.embeddings?.[0]?.values
} catch (error) {
throw error    
}
}