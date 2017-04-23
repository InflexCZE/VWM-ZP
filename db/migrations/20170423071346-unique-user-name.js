'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addIndex(
      'Users',
      [Sequelize.fn('LOWER', Sequelize.col('name'))],
      {
        name: 'users_name',
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex(
      'Users',
      ['name'],
      {
        name: 'users_name'
      }
    );
  }
};
