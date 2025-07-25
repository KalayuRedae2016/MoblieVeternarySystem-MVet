const express = require('express');
const router = express.Router();
const dashBoardController = require('../Controllers/dashBoardController');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


router
  .route('/')
  .get(dashBoardController.getDashboardData);

module.exports = router;
