const _ = require('lodash');

const errors = require('../utils/errors');

const { API_KEY, API_HEADER } = require('../config/vars');

exports.authorizeApiKey = async (req, res, next) => {
  const apiKey = _.get(req, ['headers', API_HEADER]);

  if (apiKey !== API_KEY) return next(errors.create(errors.UNAUTHORIZED));

  return next();
};
