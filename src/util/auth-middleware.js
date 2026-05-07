const responsehanlder = require('./response-handler');

const dunzoAuthMiddleware = (req, res, next) => {
    // console.log('dunzoAuthMiddleware',req.headers);
    next();
    // if(req.headers.authorization === process.env.DUNZO_CALLBACK_TOKEN){
    //     next();
    // }else{
    //     responsehanlder.hasError401(res,'Your are not authorized, Authorization failed...');  
    // }    
}

const porterAuthMiddleware = (req, res, next) => {
    // console.log('porterAuthMiddleware',req.headers);
    next();
    // if(req.headers['x-api-key'] === process.env.PORTER_CALLBACK_TOKEN){
    //     next();
    // }else{
    //     responsehanlder.hasError401(res,'Your are not authorized, Authorization failed...');  
    // }    
}

const pidgeAuthMiddleware = (req, res, next) => {
    // // console.log('pidgeAuthMiddleware',req.headers);
    next();
    // if(req.headers.authorization === process.env.PIDGE_CALLBACK_TOKEN){
    //     next();
    // }else{
    //     responsehanlder.hasError401(res,'Your are not authorized, Authorization failed...');  
    // }    
}

const shipRocketAuthMiddleware = (req, res, next) => {
    // // console.log('pidgeAuthMiddleware',req.headers);
    next();
    // if(req.headers.authorization === process.env.PIDGE_CALLBACK_TOKEN){
    //     next();
    // }else{
    //     responsehanlder.hasError401(res,'Your are not authorized, Authorization failed...');  
    // }    
}

const shadowFaxAuthMiddleware = (req, res, next) => {
    // console.log('shadowFaxAuthMiddleware',req.headers);
    next();
    // if(req.headers['x-api-key'] === process.env.SHADOWFAX_CALLBACK_TOKEN){
    //     next();
    // }else{
    //     responsehanlder.hasError401(res,'Your are not authorized, Authorization failed...');  
    // }    
}


module.exports = {
    dunzoAuthMiddleware,
    porterAuthMiddleware,
    pidgeAuthMiddleware,
    shadowFaxAuthMiddleware,
    shipRocketAuthMiddleware
}