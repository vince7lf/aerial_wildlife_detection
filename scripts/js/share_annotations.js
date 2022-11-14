const http = require('http');

let server_port = 'http://localhost:7780'
let request_url = '/test-mapserver6/requestDownloadAnnotations'

const postData = JSON.stringify({"dataType": "annotation", "extra_fields": {"meta": false}});

const options = {
    hostname: 'localhost',
    port: 7780,
    path: request_url,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();