'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn("UserVideos", "permission",{
      type: Sequelize.STRING(10)
    });
  },
  
  down (queryInterface, Sequelize) {
    return queryInterface.removeColumn("UserVideos", "permission");

  }
};
