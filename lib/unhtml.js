module.exports = unsafe => unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#096;')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
