const fs = require('fs');
const diarioRaw = fs.readFileSync('diario.json');
const diario = JSON.parse(diarioRaw);

const posts = diario[2].data;

function processPost(post) {
    const timestamp = parseInt(post.timestamp, 10);
    const lastModTimestamp = parseInt(post.latest, 10);
    const date = new Date(timestamp * 1000);
    const lastModDate = new Date(lastModTimestamp * 1000);
    let lastModStr = '';
    if (post.latest !== '0') {
        lastModStr = lastModDate.toISOString();
    }

    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    const timeOptions = {
        timeStyle: 'short',
    };
    let title = date.toLocaleDateString('es-ES', dateOptions) + ' a las ' + date.toLocaleTimeString('es-ES', timeOptions);
    title = title.substr(0,1).toUpperCase() + title.substr(1);

    const dateStr = date.getUTCFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getUTCDate();
    const postName = dateStr + '--' + timestamp + '.md';

    const postTest = String(post.text).replace('\n', '\n\n');

    const content = '---\n' +
                    'categories:\n' +
                    '- diario\n' +
                    'date: "' + date.toISOString() + '"\n' +
                    'lastmod: "' + lastModStr + '"\n' +
                    'title: "' + title + '"\n' +
                    '---\n\n' +
                    postTest;

    fs.writeFile('../' + postName, content, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
    });
}

console.log('Starting processing');
let total = posts.length;

for (let i = 0; i<total; i++) {
    processPost(posts[i]);
}

console.log('Processed', total);