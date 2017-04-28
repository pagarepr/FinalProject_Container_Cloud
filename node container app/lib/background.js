'use strict';

const Pubsub = require('@google-cloud/pubsub');
const config = require('../config');
const logging = require('./logging');

const topicName = config.get('TOPIC_NAME');
const subscriptionName = config.get('SUBSCRIPTION_NAME');

const pubsub = Pubsub({
  projectId: config.get('GCLOUD_PROJECT')
});

function getTopic (cb) {
  pubsub.createTopic(topicName, (err, topic) => {
    // topic already exists.
    if (err && err.code === 409) {
      cb(null, pubsub.topic(topicName));
      return;
    }
    cb(err, topic);
  });
}

function subscribe (cb) {
  let subscription;

  function handleMessage (message) {
    cb(null, message.data);
  }
  function handleError (err) {
    logging.error(err);
  }

  getTopic((err, topic) => {
    if (err) {
      cb(err);
      return;
    }

    topic.subscribe(subscriptionName, {
      autoAck: true
    }, (err, sub) => {
      if (err) {
        cb(err);
        return;
      }

      subscription = sub;

      // Listen to and handle message and error events
      subscription.on('message', handleMessage);
      subscription.on('error', handleError);

      logging.info(`Listening to ${topicName} with subscription ${subscriptionName}`);
    });
  });

  // Subscription cancellation function
  return () => {
    if (subscription) {
      // Remove event listeners
      subscription.removeListener('message', handleMessage);
      subscription.removeListener('error', handleError);
      subscription = undefined;
    }
  };
}

function queueAd (adId) {
  getTopic((err, topic) => {
    if (err) {
      logging.error('Error occurred while getting pubsub topic', err);
      return;
    }

    topic.publish({
      data: {
        action: 'processAd',
        adId: adId
      }
    }, (err) => {
      if (err) {
        logging.error('Error occurred while queuing background task', err);
      } else {
        logging.info(`Ad ${adId} queued for background processing`);
      }
    });
  });
}

module.exports = {
  subscribe,
  queueAd
};
