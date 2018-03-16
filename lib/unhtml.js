module.exports = unsafe => unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/ /g, '&nbsp;');
