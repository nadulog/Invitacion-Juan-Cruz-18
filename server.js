const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 5342);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, requested);

  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    const headers = {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes'
    };

    // Safari en iPhone pide el audio por partes (Range): sin esto no lo reproduce
    const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range || '');
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, stats.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), stats.size - 1) : stats.size - 1;
      response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stats.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, { ...headers, 'Content-Length': stats.size });
    fs.createReadStream(file).pipe(response);
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Invitación disponible en http://0.0.0.0:${port}`);
});
