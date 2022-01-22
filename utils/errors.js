const HttpStatus = require('http-status');
const _ = require('lodash');

const APIError = require('./APIError');

const UNAUTHORIZED = 'unauthorized';
const FORBIDDEN = 'forbidden';
const NOT_FOUND = 'not found';
const BAD_REQUEST = 'bad request';
const CONFLICT = 'conflict';
const VALIDATION = 'validation error';

const create = (type, message, error) => {
  let msg = message;

  switch (type) {
    case UNAUTHORIZED:
      return new APIError({
        title: 'UNAUTHORIZED',
        message: msg || 'unauthorized',
        errors: error,
        status: HttpStatus.UNAUTHORIZED,
      });
    case FORBIDDEN:
      return new APIError({
        title: 'FORBIDDEN',
        message: msg || 'forbidden',
        errors: error,
        status: HttpStatus.FORBIDDEN,
      });
    case NOT_FOUND:
      return new APIError({
        title: 'NOT_FOUND',
        message: msg || 'not found',
        errors: error,
        status: HttpStatus.NOT_FOUND,
      });
    case BAD_REQUEST:
      return new APIError({
        title: 'BAD_REQUEST',
        message: msg || BAD_REQUEST,
        errors: error,
        status: HttpStatus.BAD_REQUEST,
      });
    case VALIDATION:
      return new APIError({
        title: 'VALIDATION_ERROR',
        message: msg || VALIDATION,
        errors: error,
        status: HttpStatus.BAD_REQUEST,
      });
    case CONFLICT:
      return new APIError({
        title: 'CONFLICT',
        message: msg || 'conflict',
        errors: error,
        status: HttpStatus.CONFLICT,
      });
    default:
      return new APIError({
        title: 'INTERNAL SERVER ERROR',
        message: 'internal server error',
        errors: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
  }
};

exports.UNAUTHORIZED = UNAUTHORIZED;
exports.FORBIDDEN = FORBIDDEN;
exports.NOT_FOUND = NOT_FOUND;
exports.BAD_REQUEST = BAD_REQUEST;
exports.CONFLICT = CONFLICT;
exports.VALIDATION = VALIDATION;
exports.create = create;
