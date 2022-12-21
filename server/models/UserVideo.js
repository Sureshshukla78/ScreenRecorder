const sequelize = require("../database/connection");
const Sequelize = require("sequelize");
module.exports = sequelize.define(
  "UserVideo",
  {
    id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user_email: {
      type: Sequelize.STRING,
    },
    video_id: {
      type: Sequelize.INTEGER,
    },
    permission: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: true,
  }
  
);
