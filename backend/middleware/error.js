const ErrorHandler=require("../utils/error");

module.exports=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.message=err.message||"Internak Error"

//Mongoose cast error wrong error
    if(err.name==="CastError"){
        const mesage=`Resource is not found ${err.path} `
        err= new ErrorHandler(mesage,404)
    }

    res.status(err.statusCode).json({
        success:true,
        error:err.message
    })
} 