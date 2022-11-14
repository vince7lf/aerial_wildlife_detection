const http = require('http');

const postDataDownloadAnnotations = JSON.stringify({"dataType": "annotation", "extra_fields": {"meta": false}});
const reqDownloadAnnotations = http.request({
    hostname: 'localhost', port: 8080, path: '/test-mapserver6/requestDownloadAnnotations', method: 'POST', headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postDataDownloadAnnotations)
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let body = "{response: 'undefined'}"
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
        //
        body = chunk
    });
    res.on('end', () => {
        console.log('No more data in response.');
        const postData = JSON.stringify({"taskID": body.response});
        const reqPollStatus = http.request({
            hostname: 'localhost', port: 8080, path: '/test-mapserver6/pollStatus', method: 'POST', headers: {
                'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                //
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });

        reqPollStatus.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        reqPollStatus.write(postData);
        reqPollStatus.end();
    });
});

reqDownloadAnnotations.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
reqDownloadAnnotations.write(postDataDownloadAnnotations);
reqDownloadAnnotations.end();

