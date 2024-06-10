let http = require('http');
let url = require('url');
let querystring = require('querystring');
let static = require('node-static');
const fs = require('fs');

let fileServer = new static.Server('.');

let subscribers = Object.create(null);

function onSubscribe(req, res) {
  let id = Math.random();

  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  res.setHeader("Cache-Control", "no-cache, must-revalidate");

  subscribers[id] = res;

  req.on('close', function () {
    delete subscribers[id];
  });

}

function publish(message_JSON) {

  for (let id in subscribers) {
    let res = subscribers[id];
    res.end(JSON.stringify(message_JSON));
  }

  subscribers = Object.create(null);
}

function accept(req, res) {
  let urlParsed = url.parse(req.url, true);

  // new client wants messages
  if (urlParsed.pathname == '/subscribe') {
    onSubscribe(req, res);
    return;
  }

  // sending a message
  if (urlParsed.pathname == '/publish' && req.method == 'POST') {
    // accept POST
    req.setEncoding('utf8');
    let message = '';
    req.on('data', function (chunk) {
      message += chunk;
    }).on('end', function () {
      const message_JSON_new = JSON.parse(message);
      
      // data sanitization, validation
      fs.readFile('./adat.json', (err, data) => {
        const message_JSON_old = JSON.parse(data);
        
        if (message_JSON_new.led_switch) {
          message_JSON_old.led = !message_JSON_old.led;
          publish(message_JSON_old); // publish it to everyone
          fs.writeFile('./adat.json', JSON.stringify(message_JSON_old), () => {
            res.end(JSON.stringify(message_JSON_old));
          })
        } else {
          res.end("error");
        }
      })
    });

    return;
  }

  // the rest is static
  fileServer.serve(req, res);

}

function close() {
  for (let id in subscribers) {
    let res = subscribers[id];
    res.end();
  }
}

// -----------------------------------

if (!module.parent) {
  http.createServer(accept).listen(3000);
  console.log('Server running on port 3000');
} else {
  exports.accept = accept;

  if (process.send) {
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        close();
      }
    });
  }

  process.on('SIGINT', close);
}