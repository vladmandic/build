/**
  Micro http/http2 server with file monitoring and automatic app rebuild
  - can process concurrent http requests
  - monitors specified filed and folders for changes
  - triggers library and application rebuild
  - any build errors are immediately displayed and can be corrected without need for restart
  - passthrough data compression
*/

const fs = require('fs');
const zlib = require('zlib');
const http = require('http');
const http2 = require('http2');
const path = require('path');
const log = require('@vladmandic/pilogger');

let options;

// just some predefined mime types
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

function handle(url) {
  // eslint-disable-next-line no-param-reassign
  url = url.split(/[?#]/)[0];
  const result = { ok: false, stat: {}, file: '' };
  const checkFile = (f) => {
    result.file = f;
    if (fs.existsSync(f)) {
      result.stat = fs.statSync(f);
      if (result.stat.isFile()) {
        result.ok = true;
        return true;
      }
    }
    return false;
  };
  const checkFolder = (f) => {
    result.file = f;
    if (fs.existsSync(f)) {
      result.stat = fs.statSync(f);
      if (result.stat.isDirectory()) {
        result.ok = true;
        return true;
      }
    }
    return false;
  };
  return new Promise((resolve) => {
    if (checkFile(path.join(process.cwd(), options.documentRoot, url))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, url, options.defaultFile))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url, options.defaultFile))) resolve(result);
    else if (checkFolder(path.join(process.cwd(), options.documentRoot, url))) resolve(result);
    else if (checkFolder(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url))) resolve(result);
    else if (checkFolder(path.join(path.dirname(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url, options.defaultFile), url)))) resolve(result);
    else resolve(result);
  });
}

// process http requests
async function httpRequest(req, res) {
  handle(decodeURI(req.url)).then((result) => {
    // get original ip of requestor, regardless if it's behind proxy or not
    const forwarded = (req.headers['forwarded'] || '').match(/for="\[(.*)\]:/);
    const ip = (Array.isArray(forwarded) ? forwarded[1] : null) || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    if (!result || !result.ok || !result.stat) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('Error 404: Not Found\n', 'utf-8');
      log.warn(`${req.method}/${req.httpVersion}`, res.statusCode, decodeURI(req.url), ip);
    } else {
      const input = encodeURIComponent(result.file).replace(/\*/g, '').replace(/\?/g, '').replace(/%2F/g, '/').replace(/%40/g, '@').replace(/%20/g, ' ');
      if (result?.stat?.isFile()) {
        const ext = String(path.extname(input)).toLowerCase();
        const contentType = mime[ext] || 'application/octet-stream';
        const accept = req.headers['accept-encoding'] ? req.headers['accept-encoding'].includes('br') : false; // does target accept brotli compressed data
        res.writeHead(200, {
          // 'Content-Length': result.stat.size, // not using as it's misleading for compressed streams
          'Content-Language': 'en',
          'Content-Type': contentType,
          'Content-Encoding': accept ? 'br' : '',
          'Last-Modified': result.stat.mtime,
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Content-Security-Policy': "media-src 'self' http: https: data:",
        });
        const compress = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }); // instance of brotli compression with level 5
        const stream = fs.createReadStream(input);
        if (!accept) stream.pipe(res); // don't compress data
        else stream.pipe(compress).pipe(res); // compress data

        /// alternative #2 read stream and send by chunk
        // const stream = fs.createReadStream(result.file);
        // stream.on('data', (chunk) => res.write(chunk));
        // stream.on('end', () => res.end());

        // alternative #3 read entire file and send it as blob
        // const data = fs.readFileSync(result.file);
        // res.write(data);
        log.data(`${req.method}/${req.httpVersion}`, res.statusCode, contentType, result.stat.size, req.url, ip);
      }
      if (result?.stat?.isDirectory()) {
        res.writeHead(200, { 'Content-Language': 'en', 'Content-Type': 'application/json; charset=utf-8', 'Last-Modified': result.stat.mtime, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
        let dir = fs.readdirSync(input);
        dir = dir.map((f) => path.join(decodeURI(req.url), f));
        res.end(JSON.stringify(dir), 'utf-8');
        log.data(`${req.method}/${req.httpVersion}`, res.statusCode, 'directory/json', result.stat.size, req.url, ip);
      }
    }
  });
}

async function start(config) {
  options = {
    insecureHTTPParser: false,
    ...config.serve,
    // documentRoot: path.join(process.cwd(), config.documentRoot),
  };

  if (fs.existsSync(options.sslKey) && fs.existsSync(options.sslCrt)) {
    options.key = fs.readFileSync(options.sslKey);
    options.cert = fs.readFileSync(options.sslCrt);
  } else {
    try {
      const home = require.resolve('@vladmandic/build');
      options.sslKey = path.join(path.dirname(home), '..', options.sslKey);
      options.sslCrt = path.join(path.dirname(home), '..', options.sslCrt);
      options.key = fs.existsSync(options.sslKey) ? fs.readFileSync(options.sslKey) : null;
      options.cert = fs.existsSync(options.sslCrt) ? fs.readFileSync(options.sslCrt) : null;
    } catch { /**/ }
  }
  if (!options.key || !options.cert) log.warn('Cannot read SSL certificate');

  // process.chdir(path.join(__dirname, '..'));
  if (options.httpPort && options.httpPort > 0) {
    await new Promise((resolve) => {
      const server1 = http.createServer(options, httpRequest);
      server1.on('listening', () => {
        log.state('WebServer:', { ssl: false, port: options.httpPort, root: options.documentRoot });
        resolve(true);
      });
      server1.on('error', (err) => {
        log.error('HTTP server:', err.message || err);
        resolve(false);
      });
      server1.listen(options.httpPort);
    });
  }
  if (options.httpsPort && options.httpsPort > 0 && options.key && options.cert) {
    await new Promise((resolve) => {
      const server2 = http2.createSecureServer(options, httpRequest);
      server2.on('listening', () => {
        log.state('WebServer:', { ssl: true, port: options.httpsPort, root: options.documentRoot, sslKey: options.sslKey, sslCrt: options.sslCrt });
        resolve(true);
      });
      server2.on('error', (err) => {
        log.error('HTTPS server:', err.message || err);
        resolve(false);
      });
      server2.listen(options.httpsPort);
    });
  }
}

exports.start = start;
