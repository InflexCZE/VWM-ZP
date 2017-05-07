'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Parameters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    .then(function () {
      return queryInterface.addIndex(
        'Parameters',
        ['name'],
        {
          indicesType: 'UNIQUE'
        }
      );
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Parameters');
  }
};
