# Mobile Veternary Services

# 1) Creating Model and Migration for the first time
a) Create new table(Ex:User)
# npx sequelize-cli model:generate --name User --attributes name:string,
# it creates a model/user.js and an migration/xxx-createUser.js migration file
or Create Model using manually
and create miggration using npx sequelize-cli migration:generate --name create-users

b) Run migration
# npx sequelize-cli db:migrate

# 2)  Updating the Model (Adding/Changing Fields) Model and Migration
a) Edit the model with newFields (Ex:adding phoneNumber to user)
   # phoneNumber: {type: DataTypes.STRING,allowNull: true}

b) Create a new migration for this change
# npx sequelize-cli migration:generate --name add-phoneNumber-to-user

c) edit the new generated file:
# // in up()
await queryInterface.addColumn('Users', 'phoneNumber', {
  type: Sequelize.STRING,
  allowNull: true
});
# // in down()
await queryInterface.removeColumn('Users', 'phoneNumber');

d) Run migration
# npx sequelize-cli db:migrate

# 3)  for Mistakes(dev Only)
undo last migrations: npx sequelize-cli db:migrate:undo
undo all migrations: npx sequelize-cli db:migrate:undo:all
edit files and re-run: npx sequelize-cli db:migrate

# Note
1) Model = Defines structure in code (models/)
2) Migration = Applies changes to actual DB (migrations/)
3) Migration files should never be edited once run
4) Always create new migrations for updates
5) Sequelize tracks executed migrations in SequelizeMeta table
