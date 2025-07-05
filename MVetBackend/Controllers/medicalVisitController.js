const { MedicalVisit, Animal, User } = require('../Models');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');

// 🩺 Create a medical visit
exports.createVisit = catchAsync(async (req, res, next) => {
  const visit = await MedicalVisit.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { visit }
  });
});

//  Get all medical visits
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

// 🔍 Get a specific medical visit by ID
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

// ✏️ Update a visit
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

// 🗑️ Delete a visit
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

// 🔍 Get all visits by a physician
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

// 📜 Get visits for a specific animal
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
