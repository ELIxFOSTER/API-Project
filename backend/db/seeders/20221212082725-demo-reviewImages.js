'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    return queryInterface.bulkInsert(options, [
      {
        reviewId: 1,
        url: 'www.review1.com'
      },
      {
        reviewId: 2,
        url: "www.review2.com"
      },
      {
        reviewId: 3,
        url: 'www.review3.com'
      },
      {
        reviewId: 4,
        url: 'www.review4.com'
      },
      {
        reviewId: 5,
        url: 'www.review5.com'
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      url: { [Op.in]: ['www.review1.com', 'www.review2.com', 'www.review3.com', 'www.review4.com',]}
    }, {});
  }
};
