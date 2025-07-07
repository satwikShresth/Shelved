import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from 'middlewares/authMiddleware.js';

import getLandingRouter from 'routers/landingRouter.js';
import getAuthRouter from 'routers/api/auth/authRouter.js';
import getHomeRouter from 'routers/p/homeRouter.js';
import getShelfRouter from 'routers/p/api/shelf/shelfRouter.js';
import { getSearchRouter } from 'routers/p/searchRouter.js';
import {
   getFriendApiRouter,
   getFriendViewRouter,
} from 'routers/p/friendRouter.js';
import getContentRouter from 'routers/p/api/content/contentRouter.js';

const port = 3000;
const hostname = '0.0.0.0';
const env = Deno.env.get('ENV');

const authLimiter = rateLimit({
   windowMs: 1 * 60 * 1000,
   max: 20,
   message: 'Too many authentication attempts, please try again later',
   standardHeaders: true,
   legacyHeaders: false,
});

const apiLimiter = rateLimit({
   windowMs: 1 * 60 * 1000,
   max: 100,
   message: 'Too many API requests from this IP, please try again later',
   standardHeaders: true,
   legacyHeaders: false,
});

const app = express();

// Add this to your Express app setup
app.set('trust proxy', true);

// Or if you need more specific proxy trust settings:
app.set('trust proxy', 1); // Trust first proxy
// or
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']); // Trust specific ranges
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use(
   morgan((tokens, req, res) => {
      const status = parseInt(tokens.status(req, res) || '500', 10);
      const symbol = status >= 400 ? '✗' : '✓';
      const responseTime = tokens['response-time'](req, res) || '0.0';

      return `${symbol} ${tokens.method(req, res)} ${
         tokens.url(req, res)
      } [${status}] ${responseTime}ms`;
   }),
);

app.set('view engine', 'ejs');
app.set('views', './views');

//routes
app.use('/', getLandingRouter());
app.use('/api/auth', authLimiter, getAuthRouter());
//routes protected
app.use('/p/', authMiddleware);
app.use('/p/', getHomeRouter());
app.use('/p/', getSearchRouter());
app.use('/p/', getFriendViewRouter());

app.use('/p/api', apiLimiter);
app.use('/p/api/friends', getFriendApiRouter());
app.use('/p/api/shelf', getShelfRouter());
app.use('/p/api/content', getContentRouter());

if (Deno.env.get('ENV') === 'development') {
   app.use((_req, res, next) => {
      res.set(
         'Cache-Control',
         'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      next();
   });
}

app.use((req, res, next) => {
   const error = new Error(`Not Found: ${req.originalUrl}`);
   res.status(404);
   next(error);
});

app.use((error, _req, res, _next) => {
   const status = res.statusCode !== 200 ? res.statusCode : 500;

   console.error(`Error: ${error.message}`);

   res.status(status).json({
      message: error.message,
      stack: env === 'development' ? error.stack : undefined,
   });
});

app.listen(
   port,
   hostname,
   () => {
      console.log(` 🚀 Server running on http://${hostname}:${port} `);
   },
);
