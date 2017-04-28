'use strict';

const express = require('express');
const images = require('../lib/images');
const oauth2 = require('../lib/oauth2');

function getModel () {
  return require(`./model-${require('../config').get('DATA_BACKEND')}`);
}

const router = express.Router();

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

/**
 * GET /ads/ad
 */
router.get('/', (req, res, next) => {
  getModel().list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render('ads/list.jade', {
      ads: entities,
      nextPageToken: cursor
    });
  });
});

// Use the oauth2.required middleware to ensure that only logged-in users
// can access this handler.
router.get('/mine', oauth2.required, (req, res, next) => {
  getModel().listBy(
    req.user.id,
    10,
    req.query.pageToken,
    (err, entities, cursor, apiResponse) => {
      if (err) {
        next(err);
        return;
      }
      res.render('ads/list.jade', {
        ads: entities,
        nextPageToken: cursor
      });
    }
  );
});

/**
 * GET /ads/add.
 */
router.get('/add', (req, res) => {
  res.render('ads/form.jade', {
    ad: {},
    action: 'Add'
  });
});

/**
 * POST /ads/add
 */
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    const data = req.body;

    if (req.user) {
      data.createdBy = req.user.displayName;
      data.createdById = req.user.id;
    } else {
      data.createdBy = 'Anonymous';
    }

    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    getModel().create(data, true, (err, savedData) => {
      if (err) {
        next(err);
        return;
      }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);


/**
 * GET /ads/:id/edit
 */
router.get('/:ad/edit', (req, res, next) => {
  getModel().read(req.params.ad, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('ads/form.jade', {
      ad: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /ads/:id/edit
 */
router.post(
  '/:ad/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    const data = req.body;

    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    getModel().update(req.params.ad, data, true, (err, savedData) => {
      if (err) {
        next(err);
        return;
      }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);

/**
 * GET /ads/:id
 */
router.get('/:ad', (req, res, next) => {
  getModel().read(req.params.ad, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('ads/view.jade', {
      ad: entity
    });
  });
});

/**
 * GET /ads/:id/delete
 */
router.get('/:ad/delete', (req, res, next) => {
  getModel().delete(req.params.ad, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/ad/*" routes.
 */
router.use((err, req, res, next) => {
  err.response = err.message;
  next(err);
});

module.exports = router;
