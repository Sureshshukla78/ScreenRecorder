"use strict";

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable("Folders", {
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
    });
  },

  down(queryInterface, Sequelize) {
    return queryInterface.dropTable("Folders");
  },
};
