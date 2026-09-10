import axios from "axios"

export async function getWeatherTool(args:{place:string}) {
  const response = await axios.get(`https://wttr.in/${args.place}?format=j1`)
  return  response.data?.current_condition
}