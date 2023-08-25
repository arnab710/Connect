import { NextFunction, Request, Response } from "express";
import User from "../Models/UserModel";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import bcrypt from "bcryptjs";
import {IUser, user} from "../Types/UserTypes";
import { CheckPasswordChangedTime, CookieSetter, VerifyToken } from "../Utils/ControllerHelper";
import { client } from "../RedisConnection";

const register = async (req:Request,res:Response,next:NextFunction)=>{

       try{

              if(req.cookies?.jwt) return res.status(403).json({result:"fail",message:"You are already logged in"})

              const {firstName,lastName,email,password,confirmPassword,profilePicture,coverPicture} = req.body;
              if(password!==confirmPassword) return res.status(403).json({result:'fail',message:"Password and confirm password are not same"});
              
              //creating and saving new mongoose instance
              let newUser:(IUser & Document) = new User({firstName,lastName,email,password,profilePicture,coverPicture});
              await newUser.save();

              //token generation
              const token = jwt.sign({id:newUser._id},(process.env.JWT_SECRET as string),{
                     expiresIn: (process.env.JWT_EXPIRE as string)
              });

              //deleting sensitive data
              const DeletedData:string[] =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires','active','createdAt','updatedAt'];
              DeletedData.forEach((val:string) => (newUser as any)[val] = undefined);
              
              //setting jwt cookie 
              CookieSetter(token,res);

              return res.status(201).json({result:'pass',message:'User created successfully',newUser,jwtToken:token});

       }catch(err){
              console.error(err);
              return res.status(500).json({result:"fail",message:"Some error occurred"});              
       }
}

const login = async (req:Request,res:Response,next:NextFunction)=>{

       try{

              if(req.cookies?.jwt) return res.status(403).json({result:"fail",message:"You are already logged in"})

              const {email,password} = req.body;
              if(!email || !password) return res.status(400).json({result:'fail',message:'Please provide required details'});

              let user:user = await User.findOne({email}).select('+password +active');
              if(!user) return res.status(401).json({result:'fail',message:'Incorrect email or password'});

              //password check
              const encryptedPassword:string = user.password;
              const matched = await bcrypt.compare(password,encryptedPassword);
              if(!matched) return res.status(401).json({result:'fail',message:'Incorrect email or password'});

              //setting active to true if it was previously false (user previously deleted his account)
              if(user.active===false){
                     
                     user.active = true;
                     await user.save({validateBeforeSave:false});
              }

              //token generation
              const token = jwt.sign({id:user._id},(process.env.JWT_SECRET as string),{
                     expiresIn: (process.env.JWT_EXPIRE as string)
              });

              //after the save I can manipulate NewUser to delete sensitive data
              const DeletedData =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires','active'];
              DeletedData.forEach((val) => (user as any)[val] = undefined);

              //setting jwt cookie 
              CookieSetter(token,res);

              res.status(200).json({result:'pass',message:'logged-in successful',token,user});
       }
       catch(err){
              console.error(err);
              res.status(500).json({result:'fail',message:'Something went wrong'});
       }
}

const authCheck = async(req:any,res:Response,next:NextFunction) =>{

       try{

              //JWT-TOKEN from cookie or request header
              let token:string = "";
              if(req.cookies?.jwt) token=req.cookies.jwt;
              else if(req.headers && req.headers?.authorization && req.headers.authorization?.startsWith('Bearer')){
                     token = req.headers.authorization.split(" ")[1];
              }
              if(token==="") return res.status(403).json({result:"fail",message:"Please login"});

              //token verification
              const user : {id?:string,iat?:number} = {id:"",iat:0};
              const data:any = await VerifyToken(token);
                 
              user.id = data.id;
              user.iat = data.iat;

              let verifiedUser:any;
              //trying to retrieve user data from Redis Database --cache hit
              try{
                     verifiedUser = await client.get(`user:${user.id}`);
                     verifiedUser = JSON.parse(verifiedUser);
              }
              catch(err){
                     if(process.env.NODE_ENV==='development') console.error(`Redis connection problem ${err}`);
              }

              //cache miss not found in redis
              if(!verifiedUser){

                     //checking it in the DB
                     verifiedUser = await User.findById(user.id).select('+role +passwordChangedAt');
                     if(!verifiedUser) return res.status(401).json({result:'fail',message:'Some error occurred . Please login again'});

                     //checking if password changed after jwt token issued
                     const CheckPasswordChangedAfterTokenIssued = CheckPasswordChangedTime(verifiedUser.passwordChangedAt,user.iat); 
                     if(CheckPasswordChangedAfterTokenIssued) return res.status(403).json({result:'fail',message:'Password was changed'});


                     //setting the client for caching in future
                     try{
                            await client.setEx(`user:${user.id}`,60*60*2,JSON.stringify(verifiedUser));
                     }
                     catch(err){
                            if(process.env.NODE_ENV==='development') console.error(`Redis connection problem ${err}`);
                     }
              }
              //if cache hit
              else{
                     //checking if password changed after jwt token issued
                     const CheckPasswordChangedAfterTokenIssued = CheckPasswordChangedTime(verifiedUser.passwordChangedAt,user.iat); 
                     if(CheckPasswordChangedAfterTokenIssued) return res.status(403).json({result:'fail',message:'Password was changed'});
              }

              //setting verified user as user in the request object
              req.user = verifiedUser;
              
              //Calling next protected route
              next();
       }
       catch(err){
              console.error(err);
              return res.status(500).json({result:"fail",message:"Some error occurred, Please login again"});  
       }
}

const logout = async (req:any,res:Response,next:NextFunction) =>{

       try{   
              // set cookie
              res.cookie('jwt', '', {
                     expires: new Date(Date.now() - 10 * 1000), // Set it in the past to ensure deletion
                     httpOnly: true,
              });

              try{
                     //deleting from redis client
                     const user:user = req.user;
                     await client.del(`user:${user._id}`);
              }
              catch(err){
                     if(process.env.NODE_ENV==='development') console.error(`Redis connection problem ${err}`);
              }

              res.status(200).json({result:'pass',message:'Logout successful'});
       }
       catch(err){
              console.log(err);
              res.status(500).json({result:'fail',message:'Something went wrong'});
       }

}

export {register,login,authCheck,logout};