/**
 * 输出随机字符串（0-9, a-z）
 * @param {number} amount - 需要的字符数
 * @returns {string} 随机字符串
 */
module.exports = (amount) => {
    let temp = '';
    for (let i = 0; i < amount; i += 1) {
        temp += Math.random().toString(36).substring(2, 3);
    }
    return temp;
};
