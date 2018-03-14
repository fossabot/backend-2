module.exports = (amount) => {
    let temp = '';
    for (let i = 0; i < amount; i += 1) {
        temp += Math.random().toString(36).substring(2, 3);
    }
    return temp;
};
