'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.removeColumn("UserVideos", "team_members");
  },

  down (queryInterface, Sequelize) {
    return queryInterface.addColumn("UserVideos", "team_members",{
      type: Sequelize.STRING,
    });
  }
};
