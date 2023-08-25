interface IUser {
       firstName:string;
       lastName:string;
       email:string;
       password:string;
       role?:'admin'|'user';
       profilePicture?:string;
       coverPicture?:string;
       followers?:{user:string}[];
       followings?:{user:string}[];
       passwordChangedAt?:any;
       passwordResetToken?:any;
       passwordResetExpires?:any;
       active?:boolean
}

interface user extends IUser{
       save(arg0: { validateBeforeSave: boolean; }): unknown;
       _id:string
}

export {IUser,user};