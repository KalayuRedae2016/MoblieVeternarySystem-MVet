const express = require('express');
const router = express.Router();
const medicalVisitController = require('../Controllers/medicalVisitController');
const authoController = require('../Controllers/authoController');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});



router.use(authoController.authenticationJwt);
//router.use(authoController.requiredRole('doctor', 'doctor'));

router
  .route('/')
  .get(medicalVisitController.getAllVisits)
  .post(authoController.uploadFilesMiddleware,medicalVisitController.createVisit);

router
  .route('/:id')
  .get(medicalVisitController.getVisitById)
  .put(authoController.uploadFilesMiddleware,medicalVisitController.updateVisit)
  .delete(medicalVisitController.deleteVisit);

router.get('/animal/:animalId', medicalVisitController.getVisitsByAnimal);
router.get('/physician/:physicianId', medicalVisitController.getVisitsByPhysician);
router.get('/activity/daily', medicalVisitController.getDailyVisits);
router.get('/activity/weekly', medicalVisitController.getWeeklyVisits);
router.get('/appointments/patients', medicalVisitController.getAppointedPatients);

module.exports = router;
