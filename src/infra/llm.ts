
import OpenAI from "openai";
import { systemPrompt } from "../contants.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const callOpenAI = async (messages: object[], availableToolInfo) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...systemPrompt, ...messages],
    tools: availableToolInfo,
    tool_choice: "auto",
  });

  return response.choices[0].message;
};
