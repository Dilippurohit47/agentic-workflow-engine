import { exec } from "child_process"

export const pressKey = (args: { key: string }): Promise<string> => {
  return new Promise((resolve) => {
    const cmd = `powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${args.key}')"`
    exec(cmd, (error) => {
      resolve(error ? `Failed to press ${args.key}` : `Pressed ${args.key}`)
    })
  })
}