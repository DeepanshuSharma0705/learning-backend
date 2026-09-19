
import mongoose, { connect } from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: './env'
})

// asyanc fuction return some promises. when db is connected 

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port : ${process.env.PORT}`)
  })
})
.catch((err) => {
  console.log("MONGO DB connection Field: ", err);
  
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