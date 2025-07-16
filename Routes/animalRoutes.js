const express = require('express');
const router = express.Router();
const animalController = require('../Controllers/animalControllers');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


router
  .route('/')
  .get(animalController.getAllAnimals)
  .post(animalController.createAnimal)
  .delete(animalController.deleteAnimals);

router
  .route('/:id')
  .get(animalController.getAnimalById)
  .put(animalController.updateAnimal)
  .delete(animalController.deleteAnimal);

router.get('/owner/:ownerId', animalController.getAnimalsByOwner);
router.get('/:animalId/visits', animalController.getMedicalHistory);

module.exports = router;
