const Sequelize = require('sequelize');

module.exports = {
    name: { type: Sequelize.STRING(), allowNull: false, unique: true },
    title: { type: Sequelize.STRING(), allowNull: false },
    url: { type: Sequelize.STRING(), allowNull: false },
    post: { type: Sequelize.INTEGER(), allowNull: false },
};
