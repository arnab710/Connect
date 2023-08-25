import { NextFunction, Request, Response } from "express";
import { client } from "../RedisConnection";
import User from "../Models/UserModel";

const updateMe = async (req:any,res:Response,next:NextFunction) =>{

       try{
              const userID = req.user?._id;
              
             const {firstName,lastName,profilePicture,coverPicture} = req.body;

             //fetching my details from db
             const userData:any = await User.findById(userID).select("firstName lastName profilePicture coverPicture");
             if (!userData) return res.status(404).json({ result: 'fail', message: 'User not found' });

             //updating user details
             if(firstName && firstName!==userData.firstName) userData.firstName = firstName;
             if(lastName && lastName!==userData.lastName) userData.lastName = lastName;
             if(profilePicture) userData.profilePicture = profilePicture;
             if(coverPicture) userData.coverPicture = coverPicture;

             //saving userData to DB
             await userData.save();

             //deleting sensitive data
             const DeletedData =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires','active','updatedAt'];
             DeletedData.forEach((val) => (userData)[val] = undefined);

             //deleting the cache memory -- important before save
             try{
                     await client.del(`user:${userData._id}`);  //necessary for further AuthCheck
              }
              catch(err){
                     if(process.env.NODE_ENV==='development') console.log(err);
              }

             return  res.status(200).json({result:'pass',message:'Your details updated successfully'});
       }
       catch(err){
             if(process.env.NODE_ENV==='development') console.error(err);
             return res.status(500).json({result:'fail',message:'Something went wrong'});
       }
};

const deleteMe = async (req:any,res:Response,next:NextFunction) =>{
       
       try{
              const userID = req.user?._id;

              //finding the current user
              const user = await User.findById(userID).select('+active');
              if(!user) return res.status(400).json({result:'fail',message:"User not found"});

              
       }
       catch(err){
              if(process.env.NODE_ENV==='development') console.error(err);
              return res.status(500).json({result:"fail",message:"Something went wrong"});
       }
};

export {updateMe,deleteMe};