const Sequelize = require('sequelize');

module.exports = {
    name: { type: Sequelize.STRING(), allowNull: false, unique: true },
    post: { type: Sequelize.INTEGER(), allowNull: false },
};
