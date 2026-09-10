import { exec } from "child_process";

const apps ={
whatsapp:"whatsapp://",
notepad:"notepad.exe",
brave:"brave.exe",
calculator: "calc.exe",
calci: "calc.exe",
paint: "mspaint.exe",
vscode: "code"
}

export const openAnyApp = (args:{app:string}) => {
    let appName = apps[args.app.toLowerCase() as keyof typeof apps]
    if(!appName) return `i dont know how to open ${args.app}`
 return new Promise((resolve)=>{
      exec(`start "" "${appName}"`, (error) => {
    resolve(error ? `Failed to open ${args.app}.` : `Opened ${args.app}.`)
  })
 })
};

