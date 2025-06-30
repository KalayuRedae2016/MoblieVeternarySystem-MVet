const express=require("express")
const router=express.Router()

const authoController=require("../Controllers/authoController")

router.post("/signup",authoController.signup)
router.post("/login",authoController.login)
router.get("/",authoController.getAllUsers)


module.exports=router