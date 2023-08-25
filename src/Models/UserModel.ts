import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import {IUser} from "../Types/UserTypes";

const UserSchema:Schema = new mongoose.Schema<IUser>({

       firstName:{
              type : String,
              required: [true,"Please provide your first name"],
              trim: true
       },
       lastName:{
              type:String,
              required: [true,"Please provide your last name"],
              trim: true
       },
       email:{
              type:String,
              required: [true,'Please provide your email address'],
              trim: true,
              unique: true,
              validate:{
                     validator:function(val:string):boolean{
                            return validator.isEmail(val);
                     },
                     message:"Please provide a valid email"
              },
       },
       password:{
              type:String,
              required: [true,"Please provide a strong password"],
              minLength: [8,"Password should be minimum 8 characters long"],
              select:false
       },
       role:{
              type:String,
              enum:['admin','user'],
              default:'user',
              select:false
       },
       profilePicture:{
              type:String,
              default:""
       },
       coverPicture:{
              type:String,
              default:""
       },
       followers:{
              type: [{
                     user:{
                            type:mongoose.Schema.ObjectId,
                            ref: 'User'
                     }
              }],
              default: []
       },
       followings:{
              type: [{
                     user:{
                            type:mongoose.Schema.ObjectId,
                            ref: 'User'
                     }
              }],
              default: []
       },
       passwordChangedAt:{
              type:Date,
              select:false
       },
       passwordResetToken:{
              type:String,
              select:false
       },
       passwordResetExpires:{
              type:Date,
              select:false
       },
       active:{
              type:Boolean,
              default:true,
              select:false
       }
},{timestamps:true});

//hashing password
UserSchema.pre("save",async function(next){

       try{
              if(!this.isModified('password')) return next();
              this.password = await bcrypt.hash(this.password,12);
              next();
       }
       catch(err){
              console.log(err);
       }
})

const User = mongoose.model<IUser>('User', UserSchema);
export default User;