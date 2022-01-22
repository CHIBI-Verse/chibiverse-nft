const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const nocache = require('nocache');
const methodOverride = require('method-override');
const { isProd, ALLOW_ORIGIN } = require('./vars');

const app = express();

const corsOptions = {
  origin: ALLOW_ORIGIN,
  // origin: [new RegExp(`\\.${ALLOW_ORIGIN}$`), /^http?:\/\/localhost/],
  // origin: [/^http?:\/\/localhost/],
  // Array - set origin to an array of valid origins. Each origin can be a String or a RegExp.
  // For example ["http://example1.com", /\.example2\.com$/]
  // will accept any request from "http://example1.com" or from a subdomain of "example2.com".
  methods: 'GET,PUT,POST,DELETE',
  credentials: false, // enable set cookie
};

if (!isProd) {
  const morgan = require('morgan');
  const moment = require('moment');

  morgan.token('date', (req, res, tz) =>
    moment().format('MMMM Do YYYY, h:mm:ss a'),
  );

  morgan.format(
    'myformat',
    '[:date] ":method :url" :status :res[content-length] - :response-time ms',
  );

  app.use(morgan('myformat'));
}

console.info('Web Server Starting ..... ');

// parse body params and attache them to req.body
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride('X-HTTP-Method-Override'));

// secure apps by setting various HTTP headers
app.use(helmet());
// disable cache
app.use(nocache());
app.disable('x-powered-by');

// enable CORS - Cross Origin Resource Sharing
app.use(cors(corsOptions));

// trust first proxy
app.set('trust proxy', 1);

module.exports = app;
