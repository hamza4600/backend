module.exports=(theFunction)=>(req,res,next)=>{
    Promise.resolve(theFunction(req,res,next)).catch(next);
}// is global function pass afunction so it can perform try catch 
