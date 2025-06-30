const express=require("express")
const router=express.Router()

const authoController=require("../Controllers/authoController")

router.post("/signup",authoController.signup)

module.exports=router