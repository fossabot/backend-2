const Sequelize = require('sequelize');

module.exports = {
    name: { type: Sequelize.STRING(128), allowNull: false },
    email: { type: Sequelize.STRING(255), allowNull: true },
    website: { type: Sequelize.TEXT(), allowNull: true },
    parent: { type: Sequelize.INTEGER(), allowNull: true },
    content: { type: Sequelize.TEXT(), allowNull: false },
    moderated: { type: Sequelize.BOOLEAN(), allowNull: false },
    hidden: { type: Sequelize.BOOLEAN(), allowNull: false },
    ip: { type: Sequelize.CHAR(48), allowNull: true },
    user_agent: { type: Sequelize.TEXT(), allowNull: true },
};
