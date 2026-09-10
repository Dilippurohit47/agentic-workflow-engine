import dotenv from "dotenv"
import { createEmbeddings } from "../lib/embedding.js";
import { prisma } from "../utils/prisma.js";
dotenv.config()



export const isDatabaseActive = async()=>{
  try {
await prisma.$queryRaw`SELECT 1`
return true
  } catch (error) {
  return `postgres is not active: ${error instanceof Error ? error.message : String(error)}`
  }
}

export const saveInMemory = async(args:{information:string},importance=0)=>{
  if(!args.information){
    return "nothing to saved in memory"
  }
    const embedding = await createEmbeddings(args.information)
try {
    await prisma.$executeRawUnsafe(
  `
  INSERT INTO "LlmMemory" (content,importance, embedding)
  VALUES ($1, $2, $3::vector)
  `,
  args.information,
  importance,
  `[${embedding?.join(",")}]`
);

return 'ok'
} catch (error) {
  console.log(error)
throw error    
}
}


export const searchInMemory = async(args:{query:string})=>{
  try {
    console.log('------------------>',args.query)
    let connection =   await isDatabaseActive()
    if(connection !== true){
      return connection
    }
       const  queryEmbedding = await createEmbeddings(args.query)
        const results = await prisma.$queryRawUnsafe(`SELECT id,content,embedding<=>$1:: vector AS distance FROM "LlmMemory"
        WHERE embedding <=> $1::vector < 0.42  
        ORDER BY distance LIMIT 5`,`[${queryEmbedding?.join(",")}]`)
        const context = results.map((r)=>r.content).join("\n\n")

        return context 
  } catch (error) {
    console.log("error",error)
   return `error in fetching memory ${error instanceof  Error ? error?.message : String(error)}`
  }
}
