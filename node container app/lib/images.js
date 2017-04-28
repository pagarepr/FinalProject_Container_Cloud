'use strict';

const request = require('request');
const Storage = require('@google-cloud/storage');
const config = require('../config');
const logging = require('./logging');

const CLOUD_BUCKET = config.get('CLOUD_BUCKET');

const storage = Storage({
  projectId: config.get('GCLOUD_PROJECT')
});
const bucket = storage.bucket(CLOUD_BUCKET);

function downloadAndUploadImage (sourceUrl, destFileName, cb) {
  const file = bucket.file(destFileName);

  request
    .get(sourceUrl)
    .on('error', (err) => {
      logging.warn(`Could not fetch image ${sourceUrl}`, err);
      cb(err);
    })
    .pipe(file.createWriteStream())
    .on('finish', () => {
      logging.info(`Uploaded image ${destFileName}`);
      file.makePublic(() => {
        cb(null, getPublicUrl(destFileName));
      });
    })
    .on('error', (err) => {
      logging.error('Could not upload image', err);
      cb(err);
    });
}

function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next();
  }

  const gcsname = Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
}

const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});

module.exports = {
  downloadAndUploadImage,
  getPublicUrl,
  sendUploadToGCS,
  multer
};
