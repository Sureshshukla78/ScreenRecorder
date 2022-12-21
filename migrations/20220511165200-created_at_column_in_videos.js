"use strict";

module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("Videos", "createdAt", {
        type: Sequelize.DATE,
      }),
      queryInterface.addColumn("Videos", "updatedAt", {
        type: Sequelize.DATE,
      })

    ]);
  },

  down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn("Videos", "createdAt"),
      queryInterface.removeColumn("Videos", "updatedAt")
    ]);
  }
}