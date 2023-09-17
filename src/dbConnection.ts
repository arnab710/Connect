import mongoose from "mongoose"

const dbString:String = String(process.env.DB_CONNECTION_STRING?.replace("<password>",String(process.env.DB_PASS))); 

const dbConnection :()=>void = async() =>{

       try{
              await mongoose.connect(String(dbString));
              if(process.env.NODE_ENV==='development') console.log('DB successfully connected');
       }
       catch(err){
              console.log('Some error occurred while connection the DB' + err);
              process.exit(1);
       }
}
export default dbConnection;