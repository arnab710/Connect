import mongoose from "mongoose"

const dbString:String = String(process.env.DB_CONNECTION_STRING?.replace("<password>",String(process.env.DB_PASS))); 

const dbConnection :()=>void = async() =>{

       try{
       await mongoose.connect(String(dbString));
       console.log('DB successfully connected');
       }
       catch(err){
              console.log('Some error occurred while connection the DB');
              process.exit(1);
       }
}
export default dbConnection;