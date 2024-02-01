import 'zone.js/node';
import * as dotenv from 'dotenv';

import {APP_BASE_HREF} from '@angular/common';
import { Express, Request, Response, NextFunction } from 'express';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {CommonEngine} from '@angular/ssr';
import {AppServerModule} from './src/main.server';
const express = require('express');
const https = require('https');
const fs = require('fs');

dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/sign-translate/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? join(distFolder, 'index.original.html')
    : join(distFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    })
  );

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const {protocol, originalUrl, baseUrl, headers} = req;

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: distFolder,
        providers: [{provide: APP_BASE_HREF, useValue: baseUrl}],
      })
      .then(html => res.send(html))
      .catch(err => next(err));
  });

  return server;
}

function run(): void {
  const httpPort = process.env['HTTP_PORT'] || 80;
  const httpsPort = process.env['HTTPS_PORT'] || 443;
  const privateKeyPath = process.env['PRIVATE_KEY_PATH'] || 'cert/key.pem';
  const certificatePath = process.env['CERTIFICATE_PATH'] || 'cert/cert.pem';

  // Load your SSL certificates
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const certificate = fs.readFileSync(certificatePath, 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  if (httpPort !== httpsPort) {
    // Create HTTP server
    const httpServer = express();
    httpServer.use((req: Request, res: Response, next: NextFunction) => {
      if (req.secure) {
        next();
      } else {
        res.redirect(`https://${req.headers.host}:${httpsPort}${req.url}`);
      }
    });

    // Start up the HTTP server
    httpServer.listen(httpPort, () => {
      console.log(`Node Express server listening on http://localhost:${httpPort}`);
    });
  }

  // Create an HTTPS server
  const httpsServer = https.createServer(credentials, app());

  // Start up the HTTPS server
  httpsServer.listen(httpsPort, () => {
    console.log(`Node Express server listening on https://localhost:${httpsPort}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default AppServerModule;
