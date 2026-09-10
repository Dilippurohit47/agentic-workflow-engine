import { callOpenAI } from "./infra/llm.js";


class TaskFailure extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TaskFailure"
  }
}

export const runAgent = async (
  input: string,
  messages: any[],
  availableTools: any,
  toolSchemas: any[]
): Promise<string> => {
  messages.push({ role: "user", content: input }) 
  while (true) {
    try {
      const response = await callOpenAI(messages, toolSchemas) 
      const toolCalls = response?.tool_calls

      if (!toolCalls?.length) {
        messages.push(response)
        return response.content ?? ""
      }

      messages.push({ role: "assistant", content: null, tool_calls: toolCalls })

      for (const tool of toolCalls) {
        const toolName = tool?.function?.name
        console.log("calling tool", toolName)
        const args = JSON.parse(tool.function.arguments)
        const fn = availableTools[toolName]
    let data
  try {
    data = fn ? await fn(args) : `no tool found: ${toolName}`
  } catch (e) {
 if (toolName === "reportToolFailure") {
    throw new TaskFailure(
        e instanceof Error
            ? e.message
            : typeof e === "object" && e !== null && "error" in e
                ? String(e.error)
                : String(e)
    );
}
    data = `Tool ${toolName} failed: ${e instanceof Error ? e.message : e}`
  }
        console.log("tool response data",data)
        messages.push({
          role: "tool",
          content: JSON.stringify(data),
          tool_call_id: tool.id,
        })
      }
    } catch (error) {
      if(error instanceof TaskFailure){
        throw error
      }else{
      console.log("error", error)
      return "Something went wrong."
      }

    }
    
  } 
}