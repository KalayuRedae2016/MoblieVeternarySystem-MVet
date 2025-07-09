const express = require('express');
const router = express.Router();
const animalController = require('../Controllers/animalControllers');

router
  .route('/')
  .get(animalController.getAllAnimals)
  .post(animalController.createAnimal);

router
  .route('/:id')
  .get(animalController.getAnimalById)
  .put(animalController.updateAnimal)
  .delete(animalController.deleteAnimal);

router.get('/owner/:ownerId', animalController.getAnimalsByOwner);
router.get('/:animalId/visits', animalController.getMedicalHistory);

module.exports = router;
