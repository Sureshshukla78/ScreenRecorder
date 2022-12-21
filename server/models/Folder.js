const sequelize = require("../database/connection");
const Sequelize = require("sequelize");
module.exports = sequelize.define(
  "Folder",
  {
    id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER(11),
      },
      folder_name: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
  },
  {
    timestamps: false,
  }
);
