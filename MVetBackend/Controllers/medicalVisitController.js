const { MedicalVisit, Animal, User } = require('../Models');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const { processUploadFilesToSave } = require('../Utils/fileController');

//  Create a medical visit
exports.createVisit = catchAsync(async (req, res, next) => {
  console.log('Creating visit with data:', req.body);
  console.log('Authenticated user:', req.user.role);
  console.log("images to uploaded", req.files.images);
  const{animalId,visitDate,...restVisit} = req.body;
  // Validate required fields
  const requiredFields = ['animalId', 'visitDate'];
  for (const field of requiredFields) { 
    if (!req.body[field]) {
      return next(new AppError(`Missing required field: ${field}`, 404));
    }
  }
  const animal = await Animal.findByPk(animalId);
  if (!animal) return next(new AppError('Animal not found', 404));
  // Check if the authenticated user is a physician
  if (!req.user || req.user.role==='user') {
    return next(new AppError('You are not authorized to create a medical visit', 403));
  }

  let images = [];
  if(req.files && req.files.images) {
     const uploadedImages = await processUploadFilesToSave(req, req.files, req.body)
      images=uploadedImages.images|[]

  }
  const visit = await MedicalVisit.create({
    animalId,
    physicianId:req.user.id, // Use authenticated user's ID
    visitDate,
    images,
    ...restVisit
  });

  res.status(201).json({
    status: 'success',
    data: { visit }
  });
});

//  Get all medical visits in the hospital
exports.getAllVisits = catchAsync(async (req, res, next) => {
  const visits = await MedicalVisit.findAll({
    include: [
      { model: Animal, as: 'animal' },
      { model: User, as: 'physician' }
    ]
  });

  res.status(200).json({
    status: 'success',
    results: visits.length,
    data: { visits }
  });
});

// Get a specific medical visit by ID
exports.getVisitById = catchAsync(async (req, res, next) => {
  const visit = await MedicalVisit.findByPk(req.params.id, {
    include: [
      { model: Animal, as: 'animal' },
      { model: User, as: 'physician' }
    ]
  });

  if (!visit) {
    return next(new AppError('No visit found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { visit }
  });
});

//  Update a visit
exports.updateVisit = catchAsync(async (req, res, next) => {
  const [updatedCount] = await MedicalVisit.update(req.body, {
    where: { id: req.params.id }
  });

  if (updatedCount === 0) {
    return next(new AppError('No visit found to update', 404));
  }

  const updatedVisit = await MedicalVisit.findByPk(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { visit: updatedVisit }
  });
});

//  Delete a visit
exports.deleteVisit = catchAsync(async (req, res, next) => {
  const deletedCount = await MedicalVisit.destroy({
    where: { id: req.params.id }
  });

  if (deletedCount === 0) {
    return next(new AppError('No visit found to delete', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Visit deleted successfully'
  });
});

//  Get all visits by a physician
exports.getVisitsByPhysician = catchAsync(async (req, res, next) => {
  const visits = await MedicalVisit.findAll({
    where: { physicianId: req.params.physicianId },
    include: [{ model: Animal, as: 'animal' }]
  });

  res.status(200).json({
    status: 'success',
    results: visits.length,
    data: { visits }
  });
});

//  Get visits for a specific animal
exports.getVisitsByAnimal = catchAsync(async (req, res, next) => {
  const visits = await MedicalVisit.findAll({
    where: { animalId: req.params.animalId },
    include: [{ model: User, as: 'physician' }]
  });

  res.status(200).json({
    status: 'success',
    results: visits.length,
    data: { visits }
  });
});
