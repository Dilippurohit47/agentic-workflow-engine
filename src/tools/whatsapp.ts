
import open from 'open';
import { searchInMemory } from './memory.js';

export const sendMessageOnWhatsApp = async (args:{phone:string,message:string ,name:string})=>{
    try {        
    let {phone , message ,name } =args

  if (!/^\d{10,15}$/.test(phone)) {
  return `Invalid number. Search memory for ${name}'s number.`
}

  const known = await searchInMemory({ query: `${name} phone number` })
  
  if (!known || !known.includes(phone)) {
    return `I don't have ${phone} saved as ${name}'s number. Search memory for their number, or ask the user for it. Do not guess.`
  }

    if(!message) return `What message you want to send to ${name} `
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
              await open(url)
              return   `The message is written on input .For sending first confirm with user and then  call press key and enter `
    } catch (error) {
        console.log("error",error)
        return `error in seding message ${ error instanceof  Error ? error.message : error}`
    }
}