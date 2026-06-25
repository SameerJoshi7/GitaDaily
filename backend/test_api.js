const http = require('http');

const data = JSON.stringify({
  query: "I feel very anxious about my career and future",
  language: "english"
});

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/guidance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
