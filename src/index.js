// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from './app.js'
dotenv.config({
  path: './.env'
})



connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  })




/* 
This is the method: 1 to connect Db 
using async function for in case you db in other continent / other country

import express from "express";
const app = express();

(async () => {
  try{
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    // we use this in case Db loaded properly but app is not able to listion
    app.on("error", (error) => {
      console.log("ERROR : " , error);
      throw error;
    })

    app.listen(process.env.PORT, ()=>{
      console.log(`App is listenig on port ${process.env.PORT}`);
    })

  }catch{
    console.error("ERROR: ", error);
    throw err
  }
})() */