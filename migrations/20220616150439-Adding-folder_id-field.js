'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn("Videos", "folder_id",{
      type: Sequelize.INTEGER(11)
    });
  },
  
  down (queryInterface, Sequelize) {
    return queryInterface.removeColumn("Videos", "folder_id");

  }
};
