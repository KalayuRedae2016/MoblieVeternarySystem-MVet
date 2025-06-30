const express = require('express');
const mongoose=require("mongoose")
const app = express();
const router = express.Router();

const userController = require('./../Controllers/userController');
const authoController = require('../Controllers/authoController');

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.post('/register',authoController.uploadFilesMiddleware,authoController.signup);
router.post('/login',authoController.login);
// router.get('/logout',authoController.logout);

router.post('/forgetPassword', authoController.forgetPassword);
router.post('/verifyOTP', authoController.verifyOTP);
router.patch('/resetPassword',authoController.resetPassword);

// // Protect all routes after this middleware


router.use(authoController.authenticationJwt);

router.patch('/updatePassword/:userId',authoController.updatePassword);
// router.patch('/getMe',authoController.uploadFilesMiddleware,authoController.getMe);
// router.patch('/updateMe',authoController.uploadFilesMiddleware,authoController.updateMe);

// //router.use(authoController.requiredRole('admin'));

//router.patch('/resetPasswordByAdmin/:userId',authoController.resetPasswordByAdmin);
// router.patch('/edituserPermission',userController.toggleEdiUserPermission);

router.route('/')
      .get(userController.getAllUsers)
      .delete(userController.deleteUsers)

router.route('/:id')
  .get(userController.getUser)
  .patch(authoController.uploadFilesMiddleware,userController.updateUserProfile)
  .delete(userController.deleteUser);


// router.route('/active-deactive/:userId').put(userController.activateDeactiveUser);
// router.route('/sendEmails').post(userController.sendEmailMessages)

module.exports = router;
