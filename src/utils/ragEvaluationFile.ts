
import { prisma } from "./prisma.js"
import {PDFParse}  from "pdf-parse"
import fs from "fs"
const buffer = fs.readFileSync("./docs/node-pdf.pdf")
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const testCases = [
  {
    question: "What is WebSocket?",
    expected: "real-time bi-direction communication"
  },
  {
    question: "What is Express?",
    expected: "web server"
  },
  {
    question: "What is Socket.io?",
    expected: "library for real-time communication using WebSockets"
  },
  {
    question: "What does io.emit do?",
    expected: "send an event to all connected clients"
  },
  {
    question: "What does socket.emit do?",
    expected: "send an event to a specific client"
  },
  {
    question: "What is event acknowledgement?",
    expected: "receiver can send a response back to sender"
  },
  {
    question: "What is middleware?",
    expected: "function that runs before route handlers"
  },
{
  question: "What is Axios?",
  expected: "NOT_FOUND"
},
{
  question: "What is React useEffect?",
  expected: "NOT_FOUND"
},
{
  question: "What is MongoDB?",
  expected: "NOT_FOUND"
}
];



const createEmbeddings = async(data:any)=>{
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


const insertEmbeddingInDb = async(rawData,embedding)=>{
try {
    await prisma.$executeRawUnsafe(
  `
  INSERT INTO "Document" (content, embedding)
  VALUES ($1, $2::vector)
  `,
  rawData,
  `[${embedding?.join(",")}]`
);
} catch (error) {
throw error    
}
}


const saveEmbeddings = async () =>{`    `
try {
    const parser = new PDFParse({data:buffer})
const data = await parser.getText()
const text = data.text
const chunks = []
for (let i = 0;i<text.length ;i+=1000){
    chunks.push(text.slice(i,i+1000))
}
console.log(chunks.length)
let count = 0;
for (const chunk of chunks ){
    const embedding = await createEmbeddings(chunk)
   await insertEmbeddingInDb(chunk,embedding)   
   console.log("saved",count++)
}
} catch (error) {
 console.log(error)   
}
}


const getAiRes = async(query ,context ,expectedAnswer) =>{
    const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: `
Question: ${query}

Expected Answer:
${expectedAnswer}

Retrieved Context:
${context}

Does the context contain information sufficient to answer the question according to the expected answer?

Return ONLY:
1 = yes
0 = no
`
});
    return response.text
}


const getResponseFromQuery =async(query:string,expectedAnswer:string)=>{
    try {
       const  queryEmbedding = await createEmbeddings(query)
       console.log(query)
        const results = await prisma.$queryRawUnsafe(`SELECT id,content,embedding<=>$1:: vector AS distance FROM "Document" ORDER BY distance LIMIT 10`,`[${queryEmbedding?.join(",")}]`)
        const context = results.map((r)=>r.content).join("\n\n")
        // console.log(context)
        const answer = await getAiRes(query,context,expectedAnswer)
        console.log("ai response ==",answer)
    } catch (error) {
      let parsedMsg = JSON.parse(error.message)

      console.log(parsedMsg?.error?.message)
    }

}

// saveEmbeddings()
console.log('start')
const addBreak = ()=>{
    return new Promise((res,rej)=>{
        setTimeout(res,3000)
    })
}

for (const { question ,expected } of testCases) {
  await addBreak()
 await getResponseFromQuery(question,expected)
}





const getData = async()=>{
const data = await prisma.$queryRaw`
  SELECT
    id,
    content,
    embedding::text
  FROM "Document"
`;

console.log(data.length);
}

