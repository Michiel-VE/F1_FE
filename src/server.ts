import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';
import { join, resolve } from 'node:path';

/**
 * Resolve the browser directory robustly for hosted environments
 */
const browserDistFolder = process.env['BROWSER_DIST_FOLDER']
  ? resolve(process.env['BROWSER_DIST_FOLDER'])
  : join(import.meta.dirname, '../browser');

const app = express();

app.set('trust proxy', true);

// Generate a fresh per-request CSP nonce
app.use((_req, res, next) => {
  res.locals['cspNonce'] = crypto.randomBytes(16).toString('base64');
  next();
});

/**
 * Helmet configuration
 */
app.use((req, res, next) => {
  const nonce = `'nonce-${res.locals['cspNonce']}'`;

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", nonce],
        scriptSrcAttr: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://f1-api.michielve.be',
          'http://localhost:8080',
          'https://accounts.google.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  })(req, res, next);
});

const angularApp = new AngularNodeAppEngine();

function injectScriptNonce(html: string, nonce: string): string {
  if (!nonce) {
    return html;
  }

  return html.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  const nonce = res.locals['cspNonce'] as string;

  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        next();
        return;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const updatedHtml = injectScriptNonce(html, nonce);
        const headers = new Headers(response.headers);
        headers.delete('content-length');

        const patchedResponse = new Response(updatedHtml, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });

        writeResponseToNodeResponse(patchedResponse, res);
        return;
      }

      writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);