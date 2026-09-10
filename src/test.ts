import { runAgent } from "./agent.js";
import {
  availableTools,
  workerPrompt,
  workerToolInfo,
} from "./contants.js";
import { log } from "./lib/log.js";
import { prisma } from "./utils/prisma.js";
import dotenv from "dotenv";

dotenv.config();


let shuttingDown = false

process.on("SIGINT",()=>{shuttingDown = true})
process.on("SIGTERM",()=>{shuttingDown = true})

interface Task {
  instruction: string;
  id: number;
  runAt: Date;
  status: string;
  claimedAt: Date | null;
  claimedBy: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  completed:boolean
}

let interval = 2000;
export const scheduler = async () => {
  try {
      if (shuttingDown) {
        console.log("shutting down")
    await prisma.$disconnect()
    console.log("database discconnected")
  }

    console.log("finding taks");
    let taskList: Task[] = [];
    const date = new Date();

    // clear stale task
    let stale = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.task.updateMany({
      where: {
        status: "RUNNING",
        claimedAt: { lt: stale },
      },
      data: {
        status: "PENDING",
        claimedAt: null,
        claimedBy: null,
      },
    });

    const tasks = await prisma.$transaction(async (tx) => {
      const rows: Task[] = await tx.$queryRaw`
        SELECT * FROM "Task"
        WHERE status = 'PENDING' AND "runAt" <= now()
        LIMIT 5 
        FOR UPDATE SKIP LOCKED
        `;
      const taskRunMap = new Map();
      const taskTransactions = await tx.taskTransaction.findMany({
        where: {
          OR: rows.map((t) => ({
            taskId: t.id,
            runAt: t.runAt,
          })),
        },
      });

      taskTransactions.forEach((t) => {
        taskRunMap.set(`${t.taskId}-${t.runAt.toISOString()}`, t);
      });

      let taskUpdates: any[] = [];
      let taskRunUpdates: any = [];

      let newRows = rows.filter((r) => {
        let taskRun = taskRunMap.get(`${r.id}-${r.runAt.toISOString()}`);
        if (taskRun) {
          if (taskRun.status === "CONFIRMED") {
            taskUpdates.push({ id: r.id, status: "COMPLETED",claimedAt:r.claimedAt , claimedBy:r.claimedBy});
            return false;
          } else {
            taskUpdates.push({ id: r.id, status: "RUNNING",completed:false });
            return true;
          }
        }
        taskRunUpdates.push({
          taskId: r.id,
          runAt: r.runAt,
          status: "ATTEMPTED",
        });
        return true;
      });

      if (taskUpdates.length) {
        await Promise.all(
          taskUpdates.map((task) =>
            tx.task.update({
              where: {
                id: task.id,
              },
              data: {
                status: task.status,
                claimedAt: task.claimedAt ? task.claimedAt :  new Date(),
                claimedBy:  task.claimedBy ? task.claimedBy : `worker-${process.pid}`,
              },
            }),
          ),
        );
      }

      if (taskRunUpdates.length) {
        await Promise.all(
          taskRunUpdates.map((taskRun) =>
            tx.taskTransaction.upsert({
              where: {
                taskId_runAt: {
                  taskId: taskRun.taskId,
                  runAt: taskRun.runAt,
                },
              },
              create: {
                taskId: taskRun.taskId,
                runAt: taskRun.runAt,
                status: taskRun.status,
              },
              update: {
                status: taskRun.status,
              },
            }),
          ),
        );
      }

      return newRows;
    });

    if (!tasks.length) {
      console.log("Task", taskList);
      return;
    }

    console.log("waiting for 1 sec");
    await new Promise((res) => {
      setTimeout(() => {
        res("");
      }, 1000);
    });

    taskList.push(...tasks)
  
    console.log(taskList)
     await processTask(taskList)
  } catch (error) {
    console.log(error);
  } finally {
    if (!shuttingDown) setTimeout(scheduler, interval)
  }
};

scheduler();

const handleAbort = async(taskList:Task[] | [])=>{
  try {
    console.log("task list from abort -------->",taskList)

    await prisma.task.updateMany({
      where:{
        id:{in:taskList.map((t)=>t.id)}
      },data:{
        status:"PENDING",
        claimedAt:null,
        claimedBy:null
      }
    })

    process.exit(0)
  } catch (error) {
    console.log(error)
  }
}

export const processTask = async (taskList: Task[]) => {
  console.log("task started processing");
  try {
    for (let [index,task]  of taskList.entries()) {
      if(shuttingDown){
        console.log("shutting down is true ")
        let incompleteTask = taskList.slice(index,taskList.length)
      await  handleAbort(incompleteTask)
        break
      }

      try {
        const messages = [...workerPrompt];
        console.log("processing",task.id)
        const result = await runAgent(
          task.instruction,
          messages,
          availableTools,
          workerToolInfo,
        );

console.log("done",task.id)
       await prisma.$transaction(async (tx) => {
  await tx.task.update({
    where: {
      id: task.id,
    },
    data: {
      status: "COMPLETED",
    },
  });

  await tx.taskTransaction.update({
    where: {
      taskId_runAt: {
        taskId: task.id,
        runAt: task.runAt,
      },
    },
    data: {
      status: "CONFIRMED",
    },
  });
});
        log.jarvis(result);
      } catch (error) {
        console.log("error",error)
        let attempts = task.attempts + 1;
        await prisma.task.update({
          where: {
            id: task.id,
          },
          data: {
            status: attempts >= 3 ? "FAILED" : "PENDING",
            attempts: attempts,
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
