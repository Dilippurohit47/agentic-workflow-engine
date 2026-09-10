// STYLE
// - Speak naturally, as in conversation. Never use lists, bullets, markdown, or links — this is spoken aloud.
// - Brief and direct. Under 15 words unless asked for detail.
// - Greetings get one short sentence.
// - Iron Man's Jarvis.

import { changeInputMode } from "./state.js";
import { pressKey } from "./tools/keyboard.js";
import { saveInMemory, searchInMemory } from "./tools/memory.js";
import { sendTelegramMessage } from "./tools/messageTools/telegram.js";
import { openAnyApp } from "./tools/openAnyApp.js";
import { reportToolFailure, taskFailed } from "./tools/errorHandler.js";
import { getTasks, scheduleTask } from "./tools/taskManager.js";
import { getWeatherTool } from "./tools/weather.js";
import { sendMessageOnWhatsApp } from "./tools/whatsapp.js";
import {
  focusWindow,
  getActiveWindow,
  listOpenWindows,
} from "./tools/window.js";
import { playYouTube } from "./tools/youtube.js";

export const availableTools: Record<string, Function> = {
  getWeatherTool: getWeatherTool,
  saveInMemory: saveInMemory,
  searchInMemory: searchInMemory,
  playYouTube: playYouTube,
  changeInputMode: changeInputMode,
  openAnyApp: openAnyApp,
  sendMessageOnWhatsApp: sendMessageOnWhatsApp,
  pressKey: pressKey,
  getActiveWindow: getActiveWindow,
  focusWindow: focusWindow,
  listOpenWindows: listOpenWindows,
  scheduleTask: scheduleTask,
  getTasks: getTasks,
  sendTelegramMessage: sendTelegramMessage,
  taskFailed:taskFailed,
  reportToolFailure:reportToolFailure,
};

export const systemPrompt = [
  {
    role: "system",
    content: `
    Current time:${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}

    MEMORY
* Memory is available to help maintain continuity across conversations.
* Use memory in TWO situations:

1. EXPLICIT MEMORY REFERENCE

* If the user says or implies that they told you something before, search memory before responding.
* Examples: "I told you", "I already told you", "you know this", "you should remember", "as I said", "I mentioned this before", "don't you remember?", "you already know what I want".
* NEVER say you don't remember before searching memory.
 
2. CONTEXTUALLY RELEVANT MEMORY

* Search memory when information from previous conversations could meaningfully improve the current response.
* This includes personal preferences, previous purchases, plans, goals, recurring interests, frequently discussed topics, or previously discussed choices.
* Do NOT require the user to explicitly say "remember" before searching.
* Example: If the user previously discussed buying a laptop and later says "I want to buy a laptop", search memory because previous laptop preferences may be relevant.
* Example: If the user previously discussed cars and later says "I want to buy a car", search memory because their previous car preferences may help.
* Do NOT search memory merely because the user says "I", "my", "me", or makes an ordinary personal statement.

MEMORY TOOL BEHAVIOR

* When either condition above applies, ALWAYS search memory BEFORE answering.
* Never claim that you don't remember something until after searching memory.
* If memory contains relevant information, naturally incorporate it into the response.
* Do not tell the user that you searched memory.
* Do not mention the memory tool.
* Do not repeat stored information unnecessarily.
* If memory contains nothing relevant, simply continue the conversation naturally without saying "I don't have that saved."

SAVING MEMORY

* Save genuinely useful long-term personal information silently.
* Save stable preferences, recurring habits, important goals, meaningful personal context, and explicit requests to remember something.
* Do not save temporary statements or one-time conversational information.
* Search memory before saving to avoid duplicates.
* Memory storage must never determine the wording or tone of the response.

CONVERSATION

* Treat every user message as part of an ongoing natural conversation, not as an isolated request.
* Use memory to make the conversation feel continuous and personal.
* Never respond with database-style confirmations such as "Got it! You like..." merely because information was saved.
* After a memory operation, respond naturally to what the user actually said.
* When appropriate, ask a natural follow-up question or continue the topic instead of simply acknowledging the statement.

RULES - When ask about weather without location search in memory users location and give weather info. - When changing voice modes when user is idle (say user is idle for more than ) time u will get so changing input mode (dont repeat) you have 2 modes voice and text call tool to change. - Save silently(In exception you can tell). Never confirm, announce, or summarize what you stored. Respond to what the user said, not to the fact that you saved it.
`,
  },
];

export const availableToolInfo = [
  {
    type: "function",
    function: {
      name: "getWeatherTool",
      description: "Get current weather for a place",
      parameters: {
        type: "object",
        properties: {
          place: {
            type: "string",
            description: "place name like Delhi, Mumbai",
          },
        },
        required: ["place"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "saveInMemory",
      description: "Store factual information explicitly provided by the user",
      parameters: {
        type: "object",
        properties: {
          information: {
            type: "string",
            description: "The exact fact to remember",
          },
        },
        required: ["information"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchInMemory",
      description: "Search previously stored user memories",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "playYouTube",
      description: "Search and play a YouTube video based on the query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What to search and play on YouTube",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "changeInputMode",
      description:
        "Switch between voice input (microphone) and text input (keyboard). Call when the user asks to enable or disable the mic, switch to typing, or go back to voice.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["voice", "text"],
            description: "The input mode to switch to",
          },
        },
        required: ["mode"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openAnyApp",
      description:
        "Open an application on the user's computer . Dont try to open if it is already open call opelistwindows and then only change focus if it is already open",
      parameters: {
        type: "object",
        properties: {
          app: {
            type: "string",
            enum: [
              "whatsapp",
              "notepad",
              "brave",
              "calculator",
              "paint",
              "vscode",
            ],
            description:
              "Open an application on the user's computer . Dont try to open if it is already open call opelistwindows and then only change focus if it is already open",
          },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendMessageOnWhatsApp",
      description:
        "Open WhatsApp with a message pre-filled for a contact. Before calling this function, you MUST find the contact's actual phone number in memory. Never guess or use the person's name as the phone number. If the number is not available, ask the user for it. If the user has not provided the message, ask what message they want to send. The message is only pre-filled; the user must press Enter to actually send it.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description:
              "The contact's phone number, retrieved from memory. Never guess or construct this value.",
          },
          message: {
            type: "string",
            description: "The message text to pre-fill",
          },
          name: {
            type: "string",
            description: "The contact's name, used for confirmation wording",
          },
        },
        required: ["phone", "message", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pressKey",
      description:
        "before pressing any key getfocus or change the focus as users query .Press a keyboard key before pressing always check currently focused and window and switch if you want to press key in other windows . Use SendKeys syntax: {ENTER}, {TAB}, ^c for Ctrl+C.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Key to press, e.g. {ENTER}" },
        },
        required: ["key"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getActiveWindow",
      description:
        "Returns the title of the window currently in focus. Use this to check which app the user is looking at before sending keystrokes.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "focusWindow",
      description:
        "Bring an application's window to the foreground so keystrokes go to it. Call this before pressKey if the wrong app is focused. If you dont know name of opened windows call listOpenWindows to get info",
      parameters: {
        type: "object",
        properties: {
          app: {
            type: "string",
            enum: ["WhatsApp", "notepad", "brave", "Code", "calc", "mspaint"],
            description:
              "Use the ProcessName from listOpenWindows, not the window title.",
          },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listOpenWindows",
      description:
        "List all currently open application windows with their process names and titles. Call this before focusWindow to find what's available.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "scheduleTask",
      description:
        "Schedule a task to run at a future time, even if this conversation has ended. Use for reminders, scheduled messages, or anything the user wants done later.",
      parameters: {
        type: "object",
        properties: {
         instruction: {
  type: "string",
  description: `A single, complete, imperative instruction for a future agent that has no memory of this conversation and cannot ask questions. Resolve all references to concrete values BEFORE writing it — look up cities, names, numbers, and preferences now and write them in literally. Describe one execution, not a schedule. Good: 'Fetch the current weather for Bhiwandi and send it to the user on Telegram.' Bad: 'send me the weather' (no city), 'remind him' (who?), 'send weather daily at 10am' (that's a schedule, use cron) Never use relative time words in the instruction — "tomorrow", "later", "next week", "in an hour". The task runs in the future, so those will be wrong when read. Write absolute times instead: Remind the user about their 8:00 AM meeting not their meeting tomorrow at 8AM`
  
},
          runAt: {
            type: "string",
            description:
              "When to run, as an ISO 8601 timestamp. Compute this from the current time.",
          },cron: {
  type: "string",
  description: "Cron expression for recurring tasks (minute hour day month weekday). E.g. '0 10 * * *' for daily 10am, '0 10 * * 2' for Tuesdays. Omit entirely for one-off tasks."
}
        },
        required: ["instruction", "runAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTasks",
      description: "Get the user's scheduled tasks for a given day or period.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "yesterday", "tomorrow", "week", "all"],
            description: "Which period to fetch tasks for",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reportToolFailure",
      description:
        "Call this tool when any tool failed this tool  is used to report user about tool failure  ",
      parameters: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description:
              "Tool failure message whatever you received from the failure tool message propogate here that message and call this tool ",
          },
        },
        required: ["error"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendTelegramMessage",
      description:
        "Send a message to the user on Telegram. Use this to deliver reminders, notifications, and results of scheduled tasks. Send a message to the user on Telegram. Goes to the user's own chat automatically — no recipient or contact lookup needed   ",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "The message text to send. Write it as a complete, self-contained notification — the user has no conversation context when they read it.",
          },
        },
        required: ["message"],
      },
    },
  },
    {
    type: "function",
    function: {
      name: "taskFailed",
      description: "Call this when user tell you to call task Failed tool"
    },
  },
];

export const workerToolNames = [
  "getWeatherTool",
  "searchInMemory",
  "sendTelegramMessage",
  "taskFailed",
  "reportToolFailure"
];

export const workerPrompt = [
  {
    role: "system",
    content: `Current time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

You are Jarvis, executing a scheduled task. There is no user present.

DELIVERY
* Everything goes to the user via sendTelegramMessage. No recipient lookup needed.
* Write messages as plain conversational text. Never include URLs, image links, markdown, bullets, or raw data dumps. One or two short sentences.
* Example: "Good morning. It's 28°C in Bhiwandi with light rain — take an umbrella."

EXECUTION
* Complete the task, then stop. Never ask questions or wait for confirmation — nobody will answer.
* The instruction usually contains everything you need.
* If something is missing (a city, a preference), search memory. If the first search fails, try once more with different wording — e.g. "user location" then "where user lives".
* After two failed searches, stop and report what was missing. Never guess or invent values.
* Do not save new memories. Read only.
* Finish with one short sentence saying what you did or why you couldn't.
* 
*On Failure:
On any tool failure call reportToolFailure tool to report the user with error 
`
  }
]

export const workerToolInfo = availableToolInfo.filter((tool) => {
  return workerToolNames.includes(tool.function.name) && tool;
});
