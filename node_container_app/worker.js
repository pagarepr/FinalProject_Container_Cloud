'use strict';

if (process.env.NODE_ENV === 'production') {
  require('@google/cloud-trace').start();
  require('@google/cloud-debug');
}

const request = require('request');
const waterfall = require('async').waterfall;
const express = require('express');
const config = require('./config');
const logging = require('./lib/logging');
const images = require('./lib/images');
const background = require('./lib/background');
const model = require(`./ads/model-${config.get('DATA_BACKEND')}`);
const app = express();

app.use(logging.requestLogger);

app.get('/_ah/health', (req, res) => {
  res.status(200).send('ok');
});

let adCount = 0;

app.get('/', (req, res) => {
  res.send(`This worker has processed ${adCount} ads.`);
});

app.use(logging.errorLogger);

function subscribe () {
  return background.subscribe((err, message) => {
    if (err) {
      throw err;
    }
    if (message.action === 'processAd') {
      logging.info(`Received request to process Ad ${message.adId}`);
      processAd(message.adId);
    } else {
      logging.warn('Unknown request', message);
    }
  });
}

if (module === require.main) {
  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  subscribe();
}

function processAd (adId, callback) {
  if (!callback) {
    callback = logging.error;
  }
  waterfall([
    (cb) => {
      model.read(adId, cb);
    },
    findAdInfo,
    (updated, cb) => {
      model.update(updated.id, updated, false, cb);
    }
  ], (err) => {
    if (err) {
      logging.error(`Error occurred`, err);
      callback(err);
      return;
    }
    logging.info(`Updated ad ${adId}`);
    adCount += 1;
    callback();
  });
}

function findAdInfo (ad, cb) {
  queryAdsApi(ad.title, (err, r) => {
    if (err) {
      cb(err);
      return;
    }
    if (!r.items) {
      cb('Not found');
      return;
    }
    const top = r.items[0];

    ad.title = top.volumeInfo.title;
    ad.author = (top.volumeInfo.authors || []).join(', ');
    ad.publishedDate = top.volumeInfo.publishedDate;
    ad.description = ad.description || top.volumeInfo.description;
    if (ad.imageUrl || !top.volumeInfo.imageLinks) {
      return cb(null, ad);
    }

    const imageUrl =
      top.volumeInfo.imageLinks.thumbnail ||
      top.volumeInfo.imageLinks.smallThumbnail;
    const imageName = `${ad.id}.jpg`;

    images.downloadAndUploadImage(
      imageUrl, imageName, (err, publicUrl) => {
        if (!err) {
          ad.imageUrl = publicUrl;
        }
        cb(null, ad);
      });
  });
}

function queryAdsApi (query, cb) {
  request(
    `https://www.googleapis.com/ads/v1/volumes?q=${encodeURIComponent(query)}`,
    (err, resp, body) => {
      if (err || resp.statusCode !== 200) {
        cb(err || `Response returned ${resp.statusCode}`);
        return;
      }
      cb(null, JSON.parse(body));
    }
  );
}

exports.app = app;
exports.processAd = processAd;
exports.findAdInfo = findAdInfo;
exports.queryAdsApi = queryAdsApi;
