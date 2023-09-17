import mongoose from 'mongoose';

interface IComment{

       post:mongoose.Types.ObjectId;
       user:mongoose.Types.ObjectId;
       comment:string;
}

export default IComment;