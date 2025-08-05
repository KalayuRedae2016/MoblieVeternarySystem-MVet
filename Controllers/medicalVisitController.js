const { MedicalVisit, Animal, User } = require('../Models');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const { processUploadFilesToSave } = require('../Utils/fileController');
const { Op } = require('sequelize');
const logger = require('../Utils/logger');

//  Create a medical visit
exports.createVisit = catchAsync(async (req, res, next) => {
  logger.info(`start:\n`);
  logger.info(`Request body from mobile y:\n${JSON.stringify(req.body, null, 2)}`);
  logger.info(`Request files from mobile y:\n${JSON.stringify(req.files, null, 2)}`);
  
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
  // Extract query parameters
  const {
    visitDate,
    startDate,
    endDate,
    outcome,
    physicianId,
    animalId,
    immunizationGiven,
    prognosis,
    search
  } = req.query;

  // Build dynamic filter object
  const filter = {};

  // Exact date filter
  if (visitDate) {
    filter.visitDate = visitDate;
  }

  // Date range filter
  if (startDate && endDate) {
    filter.visitDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Specific field filters
  if (outcome) filter.outcome = outcome;
  if (physicianId) filter.physicianId = physicianId;
  if (animalId) filter.animalId = animalId;
  if (immunizationGiven) filter.immunizationGiven = immunizationGiven;
  if (prognosis) filter.prognosis = prognosis;

  // Optional text search on diagnosis, symptoms, recommendation
  if (search) {
    filter[Op.or] = [
      { tentativeDiagnosis: { [Op.iLike]: `%${search}%` } },
      { confirmatoryDiagnosis: { [Op.iLike]: `%${search}%` } },
      { symptoms: { [Op.iLike]: `%${search}%` } },
      { recommendation: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Fetch filtered visits
  const visits = await MedicalVisit.findAll({
    where: filter,
    include: [
      { model: Animal, as: 'animal' },
      { model: User, as: 'physician' }
    ],
    order: [['visitDate', 'DESC']] // Optional: latest first
  });

  // Send response
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

  logger.info(`Request body for updated:\n${JSON.stringify(req.body, null, 2)}`);
  logger.info(`Request files for update:\n${JSON.stringify(req.files, null, 2)}`);
  
  const medicalVisit = await MedicalVisit.findByPk(req.params.id);
  if (!medicalVisit) {
    return next(new AppError('No visit found with that ID', 404));
  }
  let {images} = await processUploadFilesToSave(req, req.files, req.body, medicalVisit)
  if(!images) images=medicalVisit.images
  const updatedData={...req.body, images};

  await medicalVisit.update(updatedData);
  const updatedMedicalVisit=await MedicalVisit.findByPk(req.params.id)

  res.status(200).json({
    status: 'success',
    message: 'Medical Visit updated successfully',
    data: updatedMedicalVisit
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
exports.deleteAllVisits = catchAsync(async (req, res, next) => {
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
exports.getMedicalHistoryByAnimal = catchAsync(async (req, res, next) => {
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

exports.getAppointedPatients= catchAsync(async (req, res, next) => {
  console.log("Fetching upcoming visits");
  
  const visits = await MedicalVisit.findAll({
    where: {
      immunizationDate: {
        [Op.gte]: new Date() // Get visits scheduled for today or later
      }
    },
    include: [
      { model: Animal, as: 'animal',include: [{ model: User, as: 'owner' }] },
      { model: User, as: 'physician' },
      
    ]
  });

  if (visits.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No upcoming visits found'
    });
  }

  res.status(200).json({
    status: 'success',
    results: visits.length,
    data: { visits }
  });
});

exports.getPatientStatus=catchAsync(async(req, res, next) => {
  console.log("Fetching patient status");
  const totalVisits = await MedicalVisit.count();
  const deceasedPatients = await MedicalVisit.count({ where: { outcome: 'deceased' } });
  const recoveredPatients = await MedicalVisit.count({ where: { outcome: 'recovered' } });
  const followUpPatients = await MedicalVisit.count({ where: { outcome: 'followUp' } });
  const referredPatients = await MedicalVisit.count({ where: { outcome: 'referred' } });
  
  res.status(200).json({
    status: 'success',
    message: 'Patient status fetched successfully',
    data: {
      totalVisits,
      deceasedPatients,
      recoveredPatients,
      followUpPatients,
      referredPatients,
    }
  });
})
 

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
//       { model: MedicalVisit, as: 'animal' },
//       { model: User, as: 'physician' }
//     ]
//   });

//   res.status(200).json({
//     status: 'success',
//     results: visits.length,
//     data: { visits }
//   });
// });