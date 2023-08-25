import {createClient} from "redis";

export const client = createClient({
       
       password: process.env.REDIS_PASSWORD,
       socket: {
         host: process.env.REDIS_HOST,
         port: Number(process.env.REDIS_PORT),
       },
});

const RedisServer = async () =>{

       try{
              client?.on('error',err=>{
                     if(process.env.NODE_ENV==='development')  console.log(`Redis connection error ${err}`)
              });
              await client?.connect();
              if(process.env.NODE_ENV==='development') console.log("Redis connect successful");
       }
       catch(err){
              client?.disconnect();
       }
};

export default RedisServer;