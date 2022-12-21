"use strict";

module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("UserVideos", "createdAt", {
        type: Sequelize.DATE,
      }),
      queryInterface.addColumn("UserVideos", "updatedAt", {
        type: Sequelize.DATE,
      })

    ]);
  },

  down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn("UserVideos", "createdAt"),
      queryInterface.removeColumn("UserVideos", "updatedAt")
    ]);
  }
}