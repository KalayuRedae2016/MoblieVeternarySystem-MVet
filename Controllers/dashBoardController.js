const { Animal, User, MedicalVisit } = require('../Models');
const { Op } = require('sequelize');
const catchAsync = require('../Utils/catchAsync');

exports.getDashboardData = catchAsync(async (req, res, next) => {
  // Correctly handle today's range
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Main stats
  const [
    appointedPatients,
    todayPhysicianOnDuty,
    todayPatientVisits,
    activeAdmins,
    nonActiveAdmins,
    activePhysicians,
    nonActivePhysicians,
    activeOwners,
    nonActiveOwners,
    totalAnimals,
    maleAnimals,
    femaleAnimals,
    speciesStats,
    totalVisits,
    deceasedPatients,
    recoveredPatients,
    followUpPatients,
    referredPatients,
  ] = await Promise.all([
    MedicalVisit.count({ where: { immunizationDate: { [Op.gte]: new Date() } } }),

    MedicalVisit.count({
      where: { visitDate: { [Op.between]: [startOfDay, endOfDay] } },
      include: [{ model: User, as: 'physician' }],
    }),

    MedicalVisit.count({
      where: { visitDate: { [Op.between]: [startOfDay, endOfDay] } },
      include: [{ model: Animal, as: 'animal' }],
    }),

    User.count({ where: { role: 'admin', isActive: true } }),
    User.count({ where: { role: 'admin', isActive: false } }),

    User.count({ where: { role: 'doctor', isActive: true } }),
    User.count({ where: { role: 'doctor', isActive: false } }),

    User.count({ where: { role: 'user', isActive: true } }),
    User.count({ where: { role: 'user', isActive: false } }),

    Animal.count(),
    Animal.count({ where: { sex: 'Male' } }),
    Animal.count({ where: { sex: 'Female' } }),

    Animal.findAll({
      attributes: ['species', [Animal.sequelize.fn('COUNT', Animal.sequelize.col('species')), 'count']],
      group: 'species',
      raw: true,
    }),

    MedicalVisit.count(),
    MedicalVisit.count({ where: { outcome: 'deceased' } }),
    MedicalVisit.count({ where: { outcome: 'recovered' } }),
    MedicalVisit.count({ where: { outcome: 'followUp' } }),
    MedicalVisit.count({ where: { outcome: 'referred' } }),
  ]);

  //  Unique physicians today
  const todayVisits = await MedicalVisit.findAll({
    where: { visitDate: { [Op.between]: [startOfDay, endOfDay] } },
    include: [{ model: User, as: 'physician', attributes: ['id'] }],
  });

  const todayPhysicianIds = new Set();
  for (const visit of todayVisits) {
    if (visit.physician) todayPhysicianIds.add(visit.physician.id);
  }

  // Zone counts optimized with Promise.all
  const zones = ['Southern', 'Central', 'SouthEast', 'NorthWest', 'West', 'East', 'Mekelle'];
  const zoneCountResults = await Promise.all(
    zones.map(zone => Animal.count({ where: { zone } }))
  );
  const zoneCounts = Object.fromEntries(zones.map((zone, i) => [zone, zoneCountResults[i]]));

  // Weekly stats
  const weeklyResult = {};
  let totalVisitCount = 0;
  const allAnimalIds = new Set();
  const allPhysicianIds = new Set();

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const visits = await MedicalVisit.findAll({
      where: { visitDate: { [Op.between]: [start, end] } },
      include: [
        { model: Animal, as: 'animal', attributes: ['id'] },
        { model: User, as: 'physician', attributes: ['id'] },
      ],
    });

    const dayAnimalIds = new Set();
    const dayPhysicianIds = new Set();

    for (const visit of visits) {
      if (visit.animal) dayAnimalIds.add(visit.animal.id);
      if (visit.physician) dayPhysicianIds.add(visit.physician.id);
    }

    dayAnimalIds.forEach(id => allAnimalIds.add(id));
    dayPhysicianIds.forEach(id => allPhysicianIds.add(id));

    const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
    weeklyResult[dayName] = {
      visitCount: visits.length,
      uniqueAnimalCount: dayAnimalIds.size,
      uniquePhysicianCount: dayPhysicianIds.size,
    };

    totalVisitCount += visits.length;
  }

  weeklyResult.weekly = {
    totalVisitCount,
    uniqueAnimalCount: allAnimalIds.size,
    uniquePhysicianCount: allPhysicianIds.size,
  };

  //  Final response
  res.status(200).json({
    status: 'success',
    message: 'Dashboard data fetched successfully',
    data: {
      appointments: {
        appointedPatients,
      },
      todaysVisits: {
        todayPhysicianOnDuty:todayPhysicianIds.size,
        todayPatientVisits,
        //uniquePhysiciansToday: todayPhysicianIds.size, 
      },
      userStats: {
        activeAdmins,
        nonActiveAdmins,
        activePhysicians,
        nonActivePhysicians,
        activeOwners,
        nonActiveOwners,
      },
      animalStats: {
        totalAnimals,
        maleAnimals,
        femaleAnimals,
        speciesStats,
        zoneCounts,
      },
      visitStats: {
        totalVisits,
        deceasedPatients,
        recoveredPatients,
        followUpPatients,
        referredPatients,
      },
      weeklyStats: weeklyResult,
    },
  });
});
