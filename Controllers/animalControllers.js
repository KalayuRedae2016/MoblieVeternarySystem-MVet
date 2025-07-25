const { Animal, User, MedicalVisit } = require('../Models');
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const {generateAnimalCode,formatUser}=require("../Utils/modelUtils")
const {Op}=require('sequelize')

console.log('Models loaded:', { Animal: !!Animal, User: !!User,MedicalVisit: !!MedicalVisit });
// Create a new animal
exports.createAnimal = catchAsync(async (req, res, next) => {
    console.log("Requste animal Creation",req.body)

    const {species,ownerId,...rest}=req.body

  if(!species) return next(new AppError("Animal Species is Required",404))
  if (!ownerId || typeof ownerId !== 'number' || ownerId <= 0) {
  return next(new AppError("A valid ownerId is required", 404));
}

 const owner=await User.findByPk(ownerId)
 if(!owner) return next(new AppError("Owner is not found,please register owner of the patient first"))
console.log("owner of the animal",formatUser(owner))

 const identificationMark=await generateAnimalCode()
 console.log("indentificationMark",identificationMark)

  const animal = await Animal.create({
    species,ownerId,identificationMark,
    ...rest
  });

  res.status(201).json({
    status: 'success',
    message:"Animal is Registered Successfully",
    data: { animal },
  });
});

// Get all animals with their owners included
exports.getAllAnimals = catchAsync(async (req, res,next) => {
console.log('Models loaded:', { Animal: !!Animal, User: !!User });
const { name, species, breed, sex, region, zone, wereda, tabie}=req.query
  const {identificationMark,ownerName, fromDate, toDate } = req.query;

  const where = {};
  const ownerWhere = {};

  if (name) where.name = { [Op.like]: `%${name}%` };
  if (species) where.species = species;
  if (breed) where.breed = breed;
  if (sex) where.sex = sex;
  if (region) where.region = region;
  if (zone) where.zone = zone;
  if (wereda) where.wereda = wereda;
  if (tabie) where.tabie = tabie;
  if(identificationMark) where.identificationMark=identificationMark
  if (fromDate && toDate) {
    where.createdAt = {
      [Op.between]: [new Date(fromDate), new Date(toDate)]
    };
  }
  if (ownerName) {
    ownerWhere.name = { [Op.like]: `%${ownerName}%` };
  }

  const animals = await Animal.findAll({
    where,
    include: [{
      model: User,
      as: 'owner',
      where: Object.keys(ownerWhere).length ? ownerWhere : undefined,
      attributes: { exclude: ['password', 'passwordResetOTP', 'passwordResetOTPExpires'] }
    }],
    //order: [['createdAt', 'DESC']]
  });
res.status(200).json({
  status:1,
  length:animals.length,
  message:"Animals Fetched Successfully",
  data:animals
})
})

//  Get a single animal by ID
exports.getAnimalById = catchAsync(async (req, res, next) => {
  const animal = await Animal.findByPk(req.params.id, {
    include: [
      { model: User, as: 'owner' },
      { model: MedicalVisit, as: 'visits' }
    ]
  });

  if (!animal) {
    return next(new AppError('No animal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    message:"Animal is Feched Successfully",
    data: animal
  });
});

// Update an animal
exports.updateAnimal = catchAsync(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('No data provided to update', 400));
  }
  if (req.body.ownerId || req.body.identificationMark) {
    return next(new AppError('No Permitted the fields to update', 400));
  }
  console.log("this is update animal request",req.body)
  const [updatedCount] = await Animal.update(req.body, {
    where: { id: req.params.id }
  });

  if (updatedCount === 0) {
    return next(new AppError('No animal found to update', 404));
  }

  const updatedAnimal = await Animal.findByPk(req.params.id);

  res.status(200).json({
    status: 'success',
    message: "Animal is Updated Successfully",
    data: { animal: updatedAnimal }
  });
});

//  Delete an animal
exports.deleteAnimal = catchAsync(async (req, res, next) => {
  const deletedCount = await Animal.destroy({
    where: { id: req.params.id }
  });

  if (deletedCount === 0) {
    return next(new AppError('No animal found to delete', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Animal deleted successfully'
  });
});

//  Delete all animals
exports.deleteAnimals = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Only admins can delete all animals', 403));
  }
  const deletedAnimals = await Animal.destroy({
    where: {},
    truncate:false
  });

  if (deletedAnimals=== 0) {
    return next(new AppError('No animal found to delete', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Animal deleted successfully'
  });
});

//  Get animals owned by a specific user
exports.getAnimalsByOwner = catchAsync(async (req, res, next) => {
  const owner= await User.findByPk(req.params.ownerId, {
    attributes: { exclude: ['password', 'passwordResetOTP', 'passwordResetOTPExpires'] },      
  });
  if (!owner) {
    return next(new AppError('No owner found with that ID', 404));
  }

  const animals = await Animal.findAll({
    where: { ownerId: req.params.ownerId },
    include: [{ model: MedicalVisit, as: 'visits' }]
  });

  res.status(200).json({
    status: 'success',
    results: animals.length,
    owner,
    animals
  });
});

exports.getAnimalStatusByZone = catchAsync(async (req, res, next) => {
  const totalAnimals = await Animal.count();

  const Southern = await Animal.count({ where: { zone: "Southern" } });
  const Centeral = await Animal.count({ where: { zone: "Centeral" } });
  const SouthEast = await Animal.count({ where: { zone: "SouthEast" } });
  const NorthWest = await Animal.count({ where: { zone: "NorthWest" } });
  const West = await Animal.count({ where: { zone: "West" } });
  const East = await Animal.count({ where: { zone: "East" } });

  const speciesStats = await Animal.findAll({
    attributes: ['species', [Animal.sequelize.fn('COUNT', Animal.sequelize.col('species')), 'count']],
    group: 'species',
    raw: true
  });

  const maleAnimals = await Animal.count({ where: { sex: 'Male' } });
  const femaleAnimals = await Animal.count({ where: { sex: 'Female' } });

  res.status(200).json({
    status: 'success',
    message: 'Animal status fetched successfully',
    data: {
      totalAnimals,
      zones: {
        Southern,
        Centeral,
        SouthEast,
        NorthWest,
        West,
        East
      },
      speciesStats,
      maleAnimals,
      femaleAnimals
    }
  });
});
