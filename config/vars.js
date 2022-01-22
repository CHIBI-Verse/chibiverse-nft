const path = require('path');

module.exports = {
  ...process.env,
  env: process.env.NODE_ENV,
  isProd: process.env.NODE_ENV === 'production',
  port: process.env.PORT,
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || '*',
  API_HEADER: process.env.API_HEADER,
  API_KEY: process.env.API_KEY,
  IMAGES_DIR: process.env.IMAGES_DIR,
  ANIMATION_DIR: process.env.ANIMATION_DIR,
  ROOT_DIR_CID: process.env.ROOT_DIR_CID,
  IMAGES_DIR_CID: process.env.IMAGES_DIR_CID,
  ANIMATION_DIR_CID: process.env.ANIMATION_DIR_CID,
};
