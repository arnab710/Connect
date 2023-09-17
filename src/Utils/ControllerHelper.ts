import { Response } from "express";
import jwt from "jsonwebtoken";
import {JwtPayload} from "../Types/jwtTypes";
import crypto from "crypto";
import SGmail from "@sendgrid/mail";

// cookie setter in response
const CookieSetter = (token:string,res:Response)=>{

       res.cookie("jwt",token,{

              expires: new Date(Date.now() + (Number(process.env.JWT_COOKIE_EXPIRE)*24*60*60*1000)),
              httpOnly:true
       });
};

//jwt verifier
const VerifyToken = (token:string) : Promise <JwtPayload> =>{

       return new Promise((resolve,reject)=>{
              jwt.verify(token,process.env.JWT_SECRET as string,(err,data)=>{

                     if(err) return reject(err);
                     return resolve(data as JwtPayload);
              })
       })
};

//password changed time checker
const CheckPasswordChangedTime = (changedTime:any,tokenTime:any) =>{

       //checking if the passwordChangedAt exist
       if(changedTime){
              
           //changing it into date object
            const date = new Date(changedTime);
           //getting and transforming passwordChangedAt time to second for comparing it with iat 
           const passwordTime = date.getTime()/1000;
   
           //checking if token issued later
           if(passwordTime<tokenTime) return false;
           else return true; 
       }
       return false; // this means password didn't changed after token was issued
};

//generating random token for reset password
const CreatePasswordResetToken = function(user:any){

       const ResetToken = crypto.randomBytes(32).toString('hex');
       
       user.passwordResetToken = crypto.createHash('sha256').update(ResetToken).digest('hex');
       
       //setting a time for after 5 mins
       user.passwordResetExpires = Date.now() + 5 * 60 * 1000;
   
       return ResetToken;
};

const EmailSender = async (UserEmail:string,url:string) =>{

       SGmail.setApiKey(process.env.SENDGRID_API as string);
   
       const message = {
           to: UserEmail,
           from:{
                     name: 'Team Connect',
                     email: 'teamconnect710@gmail.com'
              },
           subject : 'Reset Password Link (valid for 5 min)',
           text: `Click the link to reset your password. This is only valid for 5 minutes.\n Link:\n ${url}`
       }
        
      return await SGmail.send(message);
};

export {CookieSetter,VerifyToken,CheckPasswordChangedTime,CreatePasswordResetToken,EmailSender};