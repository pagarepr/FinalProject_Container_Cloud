'use strict';
const nconf = module.exports = require('nconf');
const path = require('path');

nconf
  .argv()
  .env([
    'CLOUD_BUCKET',
    'DATA_BACKEND',
    'GCLOUD_PROJECT',
    'MEMCACHE_URL',
    'MONGO_URL',
    'MONGO_COLLECTION',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'NODE_ENV',
    'OAUTH2_CLIENT_ID',
    'OAUTH2_CLIENT_SECRET',
    'OAUTH2_CALLBACK',
    'PORT',
    'SECRET',
    'SUBSCRIPTION_NAME',
    'TOPIC_NAME'
  ])

  .file({ file: path.join(__dirname, 'config.json') })

  .defaults({
    CLOUD_BUCKET: 'superb-heaven-155622',
    DATA_BACKEND: 'mongodb',
    GCLOUD_PROJECT: 'superb-heaven-155622',
    MEMCACHE_URL: 'localhost:11211',
    MONGO_URL: 'mongodb://pagare.pr:pacemaker$1@ds019633.mlab.com:19633/nodedb',
    MONGO_COLLECTION: 'advertisements',
    PORT: 8080,
    SUBSCRIPTION_NAME: 'shared-worker-subscription',
    TOPIC_NAME: 'ad-process-queue'
  });

// Check for required settings
checkConfig('GCLOUD_PROJECT');
checkConfig('CLOUD_BUCKET');

if (nconf.get('DATA_BACKEND') === 'mongodb') {
  checkConfig('MONGO_URL');
  checkConfig('MONGO_COLLECTION');
}

function checkConfig (setting) {
  if (!nconf.get(setting)) {
    throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
  }
}
