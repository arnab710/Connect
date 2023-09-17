import fs from "fs";

const deletingAssetFile = (filePath:string):Promise<string> =>{
       
       return new Promise((resolve,reject)=>{
              
              fs.unlink(filePath,err=>{
                     if(err) return reject(err);
                     return resolve('File removed successfully')
              })
       })
};

export default deletingAssetFile;