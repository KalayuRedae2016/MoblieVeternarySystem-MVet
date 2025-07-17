const { MedicalVisit, Animal, User } = require('../Models');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const { processUploadFilesToSave } = require('../Utils/fileController');
const { Op } = require('sequelize');

//  Create a medical visit
exports.createVisit = catchAsync(async (req, res, next) => {
  console.log('Creating visit with data:', req.body);
  console.log('Authenticated user:', req.user.role);
  console.log(" requested images to uploaded", req.files.images);

  const{animalId,visitDate,labResults,medications,...restVisit} = req.body;
  
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

const parsedLabResults = labResults ? JSON.parse(labResults) : null;
const parsedMedications = medications ? JSON.parse(medications) : null;

  const {images} = await processUploadFilesToSave(req, req.files, req.body)
  console.log("imagesUploaded", images);
  
  const visit = await MedicalVisit.create({
    animalId,
    physicianId:req.user.id, // Use authenticated user's ID
    visitDate,
    labResults: parsedLabResults,
    medications: parsedMedications,
    images,
    ...restVisit
  });

  res.status(200).json({
    status: 'success',
    message:"Visit created successfully",
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

//Dealete all visit
exports.deleteVisit = catchAsync(async (req, res, next) => {
  const deletedCount = await MedicalVisit.destroy({
    where: {}
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

exports.getDailyVisits = catchAsync(async (req, res, next) => {
 
  console.log("Fetching daily visits");

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const visits = await MedicalVisit.findAll({
      where: {
        visitDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        { model: Animal, as: 'animal' },
        { model: User, as: 'physician' }
      ],
      order: [['visitDate', 'ASC']]
    });

    // Extract unique animal and physician IDs
    const uniqueAnimals = new Map();
    const uniquePhysicians = new Map();

    visits.forEach(visit => {
      if (visit.animal) uniqueAnimals.set(visit.animal.id, visit.animal);
      if (visit.physician) uniquePhysicians.set(visit.physician.id, visit.physician);
    });

    return res.status(200).json({
      status: 'success',
      visitCount: visits.length,
      uniqueAnimalCount: uniqueAnimals.size,
      uniquePhysicianCount: uniquePhysicians.size,
      animals: Array.from(uniqueAnimals.values()),
      physicians: Array.from(uniquePhysicians.values())
    });

});

exports.getWeeklyVisits = catchAsync(async (req, res, next) => {
  console.log("Fetching 7-day rolling weekly visits");

  const result = {};
  const today = new Date();

  // Start from 6 days ago until today
  const dailyStats = [];
  const allAnimalIds = new Set();
  const allPhysicianIds = new Set();

  let totalVisitCount = 0;

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const visits = await MedicalVisit.findAll({
      where: {
        visitDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        { model: Animal, as: 'animal' },
        { model: User, as: 'physician' }
      ]
    });

    const uniqueAnimalIds = new Set();
    const uniquePhysicianIds = new Set();

    visits.forEach(visit => {
      if (visit.animal) uniqueAnimalIds.add(visit.animal.id);
      if (visit.physician) uniquePhysicianIds.add(visit.physician.id);

      // Add to weekly total
      if (visit.animal) allAnimalIds.add(visit.animal.id);
      if (visit.physician) allPhysicianIds.add(visit.physician.id);
    });

    const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'long' });

    result[dayName] = {
      visitCount: visits.length,
      uniqueAnimalCount: uniqueAnimalIds.size,
      uniquePhysicianCount: uniquePhysicianIds.size
    };

    totalVisitCount += visits.length;
  }

  result.weekly = {
    totalVisitCount,
    totalUniqueAnimalCount: allAnimalIds.size,
    totalUniquePhysicianCount: allPhysicianIds.size
  };

  return res.status(200).json({
    status: 'success',
    message: '7-day rolling weekly visits fetched successfully',
    ...result
  });
});

// exports.getVisitsByDateRange = catchAsync(async (req, res, next) => {
//   const { startDate, endDate } = req.query;

//   if (!startDate || !endDate) {
//     return next(new AppError('Please provide both startDate and endDate', 400));
//   }

//   const visits = await MedicalVisit.findAll({
//     where: {
//       visitDate: {
//         [Op.between]: [new Date(startDate), new Date(endDate)]
//       }
//     },
//     include: [
//       { model: Animal, as: 'animal' },
//       { model: User, as: 'physician' }
//     ]
//   });

//   res.status(200).json({
//     status: 'success',
//     results: visits.length,
//     data: { visits }
//   });
// });