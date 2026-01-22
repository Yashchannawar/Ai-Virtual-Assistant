import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
<<<<<<< HEAD
import geminiResponse from "./gemini.js"
=======
import geminiResponse from "./gemini.js


>>>>>>> c1d8e996df813f289dcd62aa885cb286445c2def

const app=express()
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
const port=process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)

// app.get("/",async (req,res)=>{
//     let prompt =req.query.prompt
//     let data =await geminiResponse(prompt)
//     res.json(data)
// })

// server created or controller
// app.get("/",(req,res)=>{
//     res.send("hii")
// })

app.listen(port,()=>{
    connectDb()
    console.log("server started")
})
