/**
  Micro http/http2 server with file monitoring and automatic app rebuild
  - can process concurrent http requests
  - monitors specified filed and folders for changes
  - triggers library and application rebuild
  - any build errors are immediately displayed and can be corrected without need for restart
  - passthrough data compression
*/

import fs from 'fs';
import * as zlib from 'zlib';
import * as http from 'http';
import * as http2 from 'http2';
import * as path from 'path';
import * as log from '@vladmandic/pilogger';

let options;

// just some predefined mime types
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};

type Result = { ok: boolean, stat: fs.Stats | null, file: string, redirect: string | null }

function handle(url): Promise<Result> {
  // eslint-disable-next-line no-param-reassign
  url = url.split(/[?#]/)[0];
  const result: Result = { ok: false, stat: null, file: '', redirect: null };
  const checkFile = (f) => {
    result.file = f;
    if (fs.existsSync(f)) {
      result.stat = fs.statSync(f);
      if (result.stat['isFile']()) {
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
      if (result.stat['isDirectory']()) {
        result.ok = true;
        return true;
      }
    }
    return false;
  };
  return new Promise((resolve) => {
    if (checkFolder(path.join(process.cwd(), options.documentRoot, url)) && (checkFile(path.join(process.cwd(), options.documentRoot, url, options.defaultFile)))) {
      result.redirect = path.join(url, options.defaultFile);
      resolve(result);
    } else if (checkFile(path.join(process.cwd(), options.documentRoot, url))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, url, options.defaultFile))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url))) resolve(result);
    else if (checkFile(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url, options.defaultFile))) resolve(result);
    else if (checkFolder(path.join(process.cwd(), options.documentRoot, url))) resolve(result);
    else if (checkFolder(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url))) resolve(result);
    else if (checkFolder(path.join(path.dirname(path.join(process.cwd(), options.documentRoot, options.defaultFolder, url, options.defaultFile, url))))) resolve(result);
    else resolve(result);
  });
}

// process http requests
async function httpRequest(req, res) {
  const url = decodeURI(req.url);
  handle(url).then((result) => {
    // get original ip of requestor, regardless if it's behind proxy or not
    const forwarded = (req.headers['forwarded'] || '').match(/for="\[(.*)\]:/);
    const remote = (Array.isArray(forwarded) ? forwarded[1] : null) || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    const protocol = req.headers[':scheme']?.toUpperCase() || 'HTTP';
    if (!result || !result.ok || !result.stat) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('Error 404: Not Found\n', 'utf-8');
      log.warn(`${protocol}:`, { method: req.method, ver: req.httpVersion, status: res.statusCode, url, remote });
    } else if (result.redirect) {
      res.writeHead(301, { Location: result.redirect });
      res.end();
      log.data(`${protocol}:`, { method: req.method, ver: req.httpVersion, status: res.statusCode, url, redirect: result.redirect, remote });
    } else {
      const input = encodeURIComponent(result.file).replace(/\*/g, '').replace(/\?/g, '').replace(/%2F/g, '/').replace(/%40/g, '@').replace(/%20/g, ' ').replace(/%3A/g, ':').replace(/%5C/g, '\\');
      // @ts-ignore method on stat object
      if (result?.stat?.isFile()) {
        const ext = String(path.extname(input)).toLowerCase();
        const contentType = mime[ext] || 'application/octet-stream';
        const rangeRequest = req.headers['range'];
        const range = rangeRequest?.replace('bytes=', '').split('-') || [0, result.stat.size - 1];
        const rangeStart = parseInt(range[0] || 0);
        const rangeEnd = parseInt(range[1] || result.stat.size - 1);
        const acceptBrotli = req.headers['accept-encoding'] ? req.headers['accept-encoding'].includes('br') : false; // does target accept brotli compressed data
        const rangeHeader = !rangeRequest ? {} : {
          'Content-Range': 'bytes ' + rangeStart + '-' + rangeEnd + '/' + result.stat.size,
          'Accept-Ranges': 'bytes',
          'Content-Length': rangeEnd - rangeStart + 1,
        };
        const corsHeader = !options.cors ? {} : {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        };
        res.writeHead(rangeRequest ? 206 : 200, {
          // 'Access-Control-Allow-Origin': '*', // disabled
          // 'Content-Length': result.stat.size, // not using standard header as it's misleading for compressed streams
          'Content-Size': result.stat.size, // this is not standard but useful for logging/debugging
          'Content-Language': 'en',
          'Content-Type': contentType,
          'Content-Encoding': (acceptBrotli && !rangeRequest) ? 'br' : '',
          'Last-Modified': result.stat.mtime.toUTCString(),
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "media-src 'self' http: https: data:",
          '`Service-Worker-Allowed': '/',
          ...corsHeader,
          ...rangeHeader,
        });
        const compress = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }); // instance of brotli compression with level 5
        const stream = !rangeRequest
          ? fs.createReadStream(input)
          : fs.createReadStream(input, { start: rangeStart, end: rangeEnd });
        if (!acceptBrotli || rangeRequest) stream.pipe(res); // don't compress data
        else stream.pipe(compress).pipe(res); // compress data
        const rangeJSON = rangeRequest ? { range: { start: rangeStart, end: rangeEnd, size: rangeEnd - rangeStart + 1 } } : {};
        log.data(`${protocol}:`, { method: req.method, ver: req.httpVersion, status: res.statusCode, mime: contentType.replace('; charset=utf-8', ''), size: result.stat.size, ...rangeJSON, url, remote });
      }
      // @ts-ignore method on stat object
      if (result?.stat?.isDirectory()) {
        res.writeHead(200, { 'Content-Language': 'en', 'Content-Type': 'application/json; charset=utf-8', 'Last-Modified': result.stat.mtime, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
        let dir = fs.readdirSync(input);
        dir = dir.map((f) => path.join(decodeURI(req.url), f));
        res.end(JSON.stringify(dir), 'utf-8');
        log.data(`${protocol}:`, { method: req.method, ver: req.httpVersion, status: res.statusCode, mime: 'directory/json', size: result.stat.size, url, remote });
      }
    }
  });
}

export async function start(config) {
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

  const res: string[] = [];
  // process.chdir(path.join(__dirname, '..'));
  if (options.httpPort && options.httpPort > 0) {
    await new Promise((resolve) => {
      const server1 = http.createServer(options, httpRequest);
      server1.on('listening', () => {
        log.state('WebServer:', { ssl: false, port: options.httpPort, root: options.documentRoot });
        res.push(`http://localhost:${options.httpPort}`);
        resolve(true);
      });
      server1.on('error', (err) => {
        log.error('WebServer HTTP:', err.message || err);
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
        res.push(`https://localhost:${options.httpsPort}`);
        resolve(true);
      });
      server2.on('error', (err) => {
        log.error('WebServer HTTPS:', err.message || err);
        resolve(false);
      });
      server2.listen(options.httpsPort);
    });
  }
  return res;
}
