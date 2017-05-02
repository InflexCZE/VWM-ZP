'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Ranks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      otherUserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      rank: {
        type: Sequelize.DOUBLE
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
        'Ranks',
        ['userId', 'otherUserId'],
        {
          indicesType: 'UNIQUE'
        }
      );
    })
    .then(function () {
      return queryInterface.addIndex(
        'Ranks',
        ['userId', 'rank']
      );
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Ranks');
  }
};
