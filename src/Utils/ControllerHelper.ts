import { Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../Types/jwtTypes";

// cookie setter in response
const CookieSetter = (token:string,res:Response)=>{

       res.cookie("jwt",token,{

              expires: new Date(Date.now() + (Number(process.env.JWT_COOKIE_EXPIRE)*24*60*60*1000)),
              httpOnly:true
       });
};

//jwt verifier
const VerifyToken = (token:string) =>{

       return new Promise((resolve,reject)=>{
              jwt.verify(token,process.env.JWT_SECRET as string,(err,data)=>{

                     if(err) return reject(err);
                     return resolve(data as (JwtPayload | null));
              })
       })
};

//password changed time checker
const CheckPasswordChangedTime = (changedTime:any,tokenTime:any) =>{

       //checking if the passwordChangedAt exist
       if(changedTime){
           //getting and transforming passwordChangedAt time to second for comparing it with iat 
           const passwordTime = changedTime.getTime()/1000;
   
           //checking if token issued later
           if(passwordTime<tokenTime) return false;
           else return true; 
       }
       return false; // this means password didn't changed after token was issued
}

export {CookieSetter,VerifyToken,CheckPasswordChangedTime};