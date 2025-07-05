const express = require('express');
const router = express.Router();
const medicalVisitController = require('../Controllers/medicalVisitController');

router
  .route('/')
  .get(medicalVisitController.getAllVisits)
  .post(medicalVisitController.createVisit);

router
  .route('/:id')
  .get(medicalVisitController.getVisitById)
  .put(medicalVisitController.updateVisit)
  .delete(medicalVisitController.deleteVisit);

router.get('/animal/:animalId', medicalVisitController.getVisitsByAnimal);
router.get('/physician/:physicianId', medicalVisitController.getVisitsByPhysician);

module.exports = router;
