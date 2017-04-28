'use strict';

// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
  require('@google/cloud-trace').start();
  require('@google/cloud-debug').start();
}

const path = require('path');
const express = require('express');
const session = require('express-session');
const MemcachedStore = require('connect-memcached')(session);
const passport = require('passport');
const config = require('./config');
const logging = require('./lib/logging');

const app = express();

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('trust proxy', true);

app.use(logging.requestLogger);

const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.get('SECRET'),
  signed: true
};

if (config.get('NODE_ENV') === 'production' && config.get('MEMCACHE_URL')) {
  sessionConfig.store = new MemcachedStore({
    hosts: [config.get('MEMCACHE_URL')]
  });
}

app.use(session(sessionConfig));

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/oauth2').router);

// Ads
app.use('/ads', require('./ads/crud'));
app.use('/api/ads', require('./ads/api'));

// Redirect root to /ads
app.get('/', (req, res) => {
  res.redirect('/ads');
});

app.get('/_ah/health', (req, res) => {
  res.status(200).send('ok');
});

app.use(logging.errorLogger);

app.use((req, res) => {
  res.status(404).send('Not Found');
});

// error handler
app.use((err, req, res, next) => {
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
