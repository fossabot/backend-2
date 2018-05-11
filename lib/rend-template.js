const rendTemplate = (str, data) => {
    const keys = Object.keys(data);
    let out = str;
    for (let i = 0; i < keys.length; i += 1) {
        out = out.split(`{{${keys[i]}}}`).join(data[keys[i]]);
    }
    return out;
};

module.exports = rendTemplate;
