import { prisma } from "../utils/prisma.js"

interface scheduleTaskProps {
    instruction:string,
    runAt:string,
    cron:string,
}

export const scheduleTask = async({instruction,runAt,cron}:scheduleTaskProps)=>{

    try {
        const when = new Date(runAt)
if (isNaN(when.getTime())) return `Invalid time: ${runAt}`
     const task =   await prisma.task.create({
            data:{
                instruction:instruction,
                runAt:when,
                cron:cron,
            },select:{
                id:true
            }
        })
        return `task is created  task:${task.id}`
    } catch (error) {
        console.log("error in creating task")
        return `error while creating task ${error  instanceof Error ? error.message : error}`
    }
}
export const getTasks = async ({ period }: { period: string }) => {
  const now = new Date()
  const start = new Date(now); start.setHours(0,0,0,0)
  const end = new Date(start); end.setDate(end.getDate() + 1)

  if (period === "yesterday") { start.setDate(start.getDate()-1); end.setDate(end.getDate()-1) }
  if (period === "tomorrow")  { start.setDate(start.getDate()+1); end.setDate(end.getDate()+1) }
  if (period === "week")      { end.setDate(end.getDate() + 7) }

  const tasks = await prisma.task.findMany({
    where: period === "all" ? {} : { runAt: { gte: start, lt: end } },
    orderBy: { runAt: "asc" }
  })

  if (!tasks.length) return `No tasks for ${period}.`
  return tasks.map(t => `${t.instruction} — ${t.runAt.toLocaleString()} (${t.status})`).join("\n")
}