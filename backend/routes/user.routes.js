import express from "express"
 import { askToAssistant, getCurrentUser, updateAssistant } from "../controllers/user.controllers.js"

import isAuth from "../middelware/isAuth.js"
import upload from "../middelware/multer.js"

const userRouter=express.Router()

userRouter.get("/current",isAuth, getCurrentUser)

userRouter.post("/update",upload.single("assistantImage"),isAuth,updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)

export default userRouter