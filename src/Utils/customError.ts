class customError extends Error{

       statusCode:number;
       isAlreadyHandled:boolean; // this boolean is for the errors to identify which we already handled in next() fxn 

       constructor(statusCode:number,message:string){
              
              super(message);
              this.statusCode = statusCode;
              this.isAlreadyHandled = true;              
              Error.captureStackTrace(this,this.constructor);
       }
};

export default customError;