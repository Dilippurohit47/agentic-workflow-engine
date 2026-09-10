export const taskFailed = ()=>{
return new Promise((res,rej)=>{
    setTimeout(()=>rej("task failed due to heavy rain in my area"),1000)
})
}

export const reportToolFailure = (error:string)=>{
    return Promise.reject(error) 
}

