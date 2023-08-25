import dotenv from "dotenv"
dotenv.config({path:`${__dirname}/../config.env`});
import app from "./app";
import dbConnection from "./dbConnection";
import RedisServer from "./RedisConnection";
const PORT  = process.env.PORT || 3000;

const server : () =>void = async() =>{
       
       dbConnection(); //DB connection
       await RedisServer(); //Redis connection
       app.listen(PORT,()=>{console.log(`App is running at port ${PORT}`)});
}

//running the server
server();