const toTextHtml = str => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/ /g, '&nbsp;')
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>');

module.exports = toTextHtml;
