import mongoose from "mongoose";

interface IUser {
       _id?: mongoose.Types.ObjectId;
       firstName:string;
       lastName:string;
       email:string;
       password:string;
       role?:'admin'|'user';
       profilePicture?:string;
       coverPicture?:string;
       followers:{user: string}[];
       followings:{user: string}[];
       passwordChangedAt?:any;
       passwordResetToken?:any;
       passwordResetExpires?:any;
       active?:boolean;
       city:string;
       country:string;
       bio:string;
       occupation:string;
}


export {IUser};