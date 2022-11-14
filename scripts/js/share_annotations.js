// For fun .. not used. Done it in javascript ref file modules/LabelUI/static/js/dataHandler.js _exportShareAnnotations
// curl 'http://localhost:7780/test-mapserver6/requestDownloadAnnotations' \
//   -H 'Accept: application/json, text/javascript, */*; q=0.01' \
//   -H 'Content-Type: application/json; charset=UTF-8' \
//   -H 'Origin: http://localhost:7780' \
//   --data-raw '{"dataType":"annotation","extra_fields":{"meta":false}}' \
//   --compressed

// run: node share_annotations.js
const http = require('http');

const postData = JSON.stringify({"dataType": "annotation", "extra_fields": {"meta": false}});
const req = http.request({
    hostname: 'localhost', port: 8080, path: '/test-mapserver6/requestDownloadAnnotations', method: 'POST', headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData)
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let body = "{response: 'undefined'}"
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
        // from there, the file is being generated and copied to the project folder, named <projectname>.csv
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

