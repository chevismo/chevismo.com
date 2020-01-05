const fs = require('fs');
const path = require("path");

const posts = load('./diario.json');
const comments = load('./diarioCom.json');

const diarioPath = '../content/diario/';

const commentsPerPost = {};

/* --- SOME HELPER METHODS --- */

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function load(pathStr) {
    let raw = String(fs.readFileSync(path.resolve(__dirname, pathStr)));
    
    const cleanup = [
        {
            regex: /\u00AD/gm,
            value: '',
        }, {
            regex: /Ã¢â€šÂ¬/gm,
            value: '€',
        }, {
            regex: /Ãƒâ€œ/gm,
            value: 'Ó',
        }, {
            regex: /Ãƒâ€°/gm,
            value: 'É',
        }, {
            regex: /ÃƒÂ¡/gm,
            value: 'á',
        }, {
            regex: /ÃƒÂ©/gm,
            value: 'é',
        }, {
            regex: /ÃƒÂ±/gm,
            value: 'ñ',
        }, {
            regex: /ÃƒÂ³/gm,
            value: 'ó',
        }, {
            regex: /ÃƒÂº/gm,
            value: 'ú',
        }, {
            regex: /ÃƒÂ¼/gm,
            value: 'ü',
        }, {
            regex: /Ã‚Â¿/gm,
            value: '¿',
        }, {
            regex: /ÃƒÂ¶/gm,
            value: '^',
        }, {
            regex: /ÃƒÂ/gm,
            value: 'í',
        }, {
            regex: /ÃƒÂ/gm,
            value: 'Á',
        }, {
            regex: /Ã‚Â¬Ã‚Â¬u/gm,
            value: '¬¬',
        }, {
            regex: /Ã‚Â¬Ã‚Â¬/gm,
            value: '¬¬',
        }, {
            regex: /Ã‚Â¡/gm,
            value: '¡',
        }, {
            regex: /Ã‚Â¿/gm,
            value: '¿',
        }, {
            regex: /Â¿/gm,
            value: '¿',
        }, {
            regex: /Â¡/gm,
            value: '¡',
        }, {
            regex: /Ã±/gm,
            value: 'ñ',
        }, {
            regex: /Ã¡/gm,
            value: 'á',
        }, {
            regex: /Ã©/gm,
            value: 'é',
        }, {
            regex: /Ã³/gm,
            value: 'ó',
        }, {
            regex: /Ãº/gm,
            value: 'ú',
        }, {
            regex: /Ã/gm,
            value: 'í',
        }, {
            regex: /\\\\&quot;/gm,
            value: '\\"',
        }, {
            regex: /\\&quot;/gm,
            value: '\\"',
        }, {
            regex: /&quot;/gm,
            value: '\\"',
        }, {
            regex: /â€”/gm,
            value: '\\"',
        }
    ];
    cleanup.forEach(pair => {
        raw = raw.replace(pair.regex, pair.value);
    });
    return JSON.parse(raw)[2].data;
}

function processComment(comment) {
    if (!commentsPerPost[comment.did]) {
        commentsPerPost[comment.did] = [];
    }
    commentsPerPost[comment.did].push(comment);
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

function getDateStr(date) {
    const str = date.toLocaleDateString('es-ES', dateOptions) + ' a las ' + date.toLocaleTimeString('es-ES', timeOptions);
    return str.substr(0,1).toUpperCase() + str.substr(1);
}

function simplifyComment(rawComment) {
    const commentTimestamp = parseInt(rawComment.timestamp, 10);
    const commentDate = new Date(commentTimestamp * 1000);
    return {
        date: getDateStr(commentDate),
        ident: rawComment.ident,
        comment: rawComment.msg.replace(/\n/gm, '\\n').replace(/"/gm, '\\"').replace(/[\x00-\x1F\x7F-\x9F]/gm, ""),
    };
}

function processPost(post) {
    const timestamp = parseInt(post.timestamp, 10);
    const lastModTimestamp = parseInt(post.latest, 10);
    const date = new Date(timestamp * 1000);
    const lastModDate = new Date(lastModTimestamp * 1000);
    let lastModStr = '';
    if (post.latest !== '0') {
        lastModStr = lastModDate.toISOString();
    }
    
    const title = getDateStr(date);

    const dateStr = date.getUTCFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getUTCDate();
    const postName = dateStr + '--' + timestamp + '.md';

    const postTest = String(post.text).replace(/\n/gm, '  \n');

    let commentsNum = 0;
    let commentListStr = 'commentList:\n';

    const postComments = commentsPerPost[post.timestamp];
    if (postComments && postComments.length > 0) {
        commentsNum = postComments.length;

        const commentContent = postComments.map(
            simplifyComment
        ).map(eachComment =>
            '-' + Object.keys(eachComment).map(field => ` ${field}: "${eachComment[field]}"\n`).join(' ')
        ).join('');

        commentListStr = commentListStr +
                         commentContent;
    }

    const content = '---\n' +
                    'categories:\n' +
                    '- diario\n' +
                    'date: "' + date.toISOString() + '"\n' +
                    'lastmod: "' + lastModStr + '"\n' +
                    'title: "' + title + '"\n' +
                    'comments: ' + commentsNum + '\n' + 
                    'id: ' + post.timestamp + '\n' + 
                    // 'resources:\n' + 
                    // '- name: comments\n' + 
                    // '  src: comments/'+post.timestamp+'.json\n' + 
                    commentListStr +
                    '---\n\n' +
                    postTest;

    fs.writeFile(path.resolve(__dirname, diarioPath + postName), content, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
    });
}

/* --- START CONVERSION --- */

console.log('Processing comments...');

for (let i = 0; i<comments.length; i++) {
    processComment(comments[i]);
}

console.log(' - All comments parsed');
console.log('Processing posts...');

let total = posts.length;

for (let i = 0; i<total; i++) {
    processPost(posts[i]);
}

console.log(' - All posts parsed');


// // save comments to json files
// Object.keys(commentsPerPost).forEach(postId => {
//   const postComments = commentsPerPost[postId].map(eachComment => {
//   const commentTimestamp = parseInt(eachComment.timestamp, 10);
//   const commentDate = new Date(commentTimestamp * 1000);
//   return {
//       date: getDateStr(commentDate),
//       ident: eachComment.ident,
//       comment: eachComment.message,
//   };
//   });

//   const fileName = postId + '.json';

//   fs.writeFile(diarioPath + 'comments/' + fileName, JSON.stringify(postComments), (err) => {
//     // throws an error, you could also catch it here
//     if (err) throw err;
//   });
// });


// console.log('Processed', total);