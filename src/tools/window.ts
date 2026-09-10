import { exec } from "child_process"

export const getActiveWindow = (): Promise<string> => {
  return new Promise((resolve) => {
    const cmd = `powershell -c "Add-Type -AssemblyName System.Windows.Forms; Add-Type '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();' -Name W -Namespace N -PassThru | Out-Null; $h=[N.W]::GetForegroundWindow(); (Get-Process | Where-Object {$_.MainWindowHandle -eq $h}).MainWindowTitle"`
    exec(cmd, (err, stdout) => {
      resolve(err ? "unknown" : stdout.trim())
    })
  })
}
export const focusWindow = (args: {app: string}): Promise<string> => {
  return new Promise((resolve) => {
    const ps = `
      Add-Type '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);' -Name W -Namespace N;
      $p = Get-Process '${args.app}' -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -First 1;
      if ($p) { [N.W]::ShowWindow($p.MainWindowHandle, 9); [N.W]::SetForegroundWindow($p.MainWindowHandle) }
      else { Write-Output 'not found'; exit 1 }
    `.replace(/\s+/g, ' ')

    exec(`powershell -c "${ps.replace(/"/g, '\\"')}"`, (err) => {
      resolve(err ? `${args.app} is not open` : `Focused ${args.app}`)
    })
  })
}
export const listOpenWindows = (): Promise<string> => {
  return new Promise((resolve) => {
    const cmd = `powershell -c "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object ProcessName, MainWindowTitle | ConvertTo-Json"`
    exec(cmd, (err, stdout) => {
      if (err) return resolve("Couldn't list windows.")
      try {
        const wins = JSON.parse(stdout)
        const list = (Array.isArray(wins) ? wins : [wins])
          .map(w => `${w.ProcessName}: ${w.MainWindowTitle}`)
          .join("\n")
        resolve(list || "No windows open.")
      } catch {
        resolve(stdout.trim())
      }
    })
  })
}