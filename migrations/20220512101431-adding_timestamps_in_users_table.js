"use strict";

module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("Users", "createdAt", {
        type: Sequelize.DATE,
      }),
      queryInterface.addColumn("Users", "updatedAt", {
        type: Sequelize.DATE,
      })
    ]);
  },

  down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn("Users", "createdAt"),
      queryInterface.removeColumn("Users", "updatedAt")
    ]);
  }
}