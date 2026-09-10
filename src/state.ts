export let inputMode:"voice" | "text"   = "text" 

export const changeInputMode = (args: { mode: "voice" | "text" }) => {
    console.log("swithiching to mode now")
  inputMode = args.mode
  return `Input mode is now ${args.mode}.`
}