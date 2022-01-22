const all = require('it-all');
const { MakeMinty } = require('../../lib/minty');

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const http = require('http');
const app = require('../../config/express');
const config = require('../../config/vars');
const { setLogger } = require('../../config/logger');

const error = require('../../middlewares/error');
const authMiddlewares = require('../../middlewares/auth');

const {
  port,
  env,
  IMAGES_DIR,
  ANIMATION_DIR,
  ROOT_DIR_CID,
  IMAGES_DIR_CID,
  ANIMATION_DIR_CID,
} = config;
const Logger = setLogger('uploader');

const upload = (minty) => async (req, res, next) => {
  try {
    const { params } = req;
    const { tokenID } = params;

    let metadata = null;

    const metadata_path = path.join(
      __dirname,
      `../../assets/json/${tokenID}.json`,
    );

    console.log({ metadata, tokenID });

    if (fs.existsSync(metadata_path)) {
      metadata = fs.readFileSync(metadata_path, 'utf-8');

      const metadataCid = await minty.ipfs.files.write(
        `/${tokenID}.json`,
        metadata,
        {
          create: true,
        },
      );

      // let rootDirectoryStats = await minty.ipfs.files.stat('/');
      // console.log({ rootDirectoryStats });

      // const metadataURI =
      //   minty.ensureIpfsUriPrefix(metadataCid) + `/${tokenID}.json`;
      console.log({
        metadataURI: `ipfs://QmfYza3wYKrQ7jGa1Gxqe6z2r6wFC2W3ejCSShsucGRFWk/${tokenID}.json`,
      });
      //file exists
    }

    // await minty.ipfs.files.rm(
    //   '/bafybeifilqolwqozw2t6kyhp42yex7pixgq5i5cwjb6ygvm47gzqw44b2a',
    //   { recursive: true },
    // );

    // rootDirectoryContents = await all(minty.ipfs.files.ls('/'));
    // console.log({ rootDirectoryContents });

    //   await minty.ipfs.files.mkdir('/images', { parents: true });

    //   const rootDirectoryContents2 = await all(minty.ipfs.files.ls('/'));
    //   console.log({ rootDirectoryContents2 });

    //   const directoryStatus = await minty.ipfs.files.stat('/');
    //   console.log({ directoryStatus });

    // const filepathsToMove = ['/Retro.mp4'];
    // await minty.ipfs.files.mv(...filepathsToMove, '/images');

    //  // alternatively, wrapping multiple mv calls into a single async function with await:
    //   const filesToMove = rootDirectoryContents.filter((item) => item.type === 0);
    //   await Promise.all(
    //     filesToMove.map((file) => {
    //       return minty.ipfs.files.mv('/' + file.name, '/images');
    //     }),
    //   );

    // const someStuffDirectoryContents = await all(minty.ipfs.files.ls('/images'));
    // console.log({ someStuffDirectoryContents });

    // let secretMessage = (
    //   await toBuffer(minty.ipfs.files.read('/some/stuff/success.txt'))
    // ).toString('utf8');

    // console.log({ secretMessage });

    return res.json({ success: true, message: 'Success' });
  } catch (error) {
    console.log({ error });
    Logger.error(error);
    return next(error);
  }
};

async function init() {
  try {
    const minty = await MakeMinty();

    // await minty.ipfs.files.mkdir(`/${IMAGES_DIR}`, { parents: true });
    // await minty.ipfs.files.mkdir(`/${ANIMATION_DIR}`, { parents: true });

    let rootDirectoryContents = await all(minty.ipfs.files.ls('/'));
    console.log({ rootDirectoryContents });
    let rootDirectoryStats = await minty.ipfs.files.stat('/');
    console.log({ rootDirectoryStats });

    const imagesDir = _.find(
      rootDirectoryContents,
      (o) => o.type === 'directory' && o.name === IMAGES_DIR,
    );

    if (!imagesDir) {
      Logger.error(`fatal /${IMAGES_DIR} not found`);
      return process.exit(1);
    }

    const animationDir = _.find(
      rootDirectoryContents,
      (o) => o.type === 'directory' && o.name === ANIMATION_DIR,
    );

    if (!animationDir) {
      Logger.error(`fatal /${ANIMATION_DIR} not found`);
      return process.exit(1);
    }

    if (_.toString(rootDirectoryStats.cid) !== ROOT_DIR_CID) {
      Logger.error(`fatal / [${rootDirectoryStats.cid}] != [${ROOT_DIR_CID}]`);
      return process.exit(1);
    }
    if (_.toString(imagesDir.cid) !== IMAGES_DIR_CID) {
      Logger.error(
        `fatal /${imagesDir.name} [${imagesDir.cid}] != [${IMAGES_DIR_CID}]`,
      );
      return process.exit(1);
    }
    if (_.toString(animationDir.cid) !== ANIMATION_DIR_CID) {
      Logger.error(
        `fatal /${animationDir.name} [${animationDir.cid}] != [${ANIMATION_DIR_CID}]`,
      );
      return process.exit(1);
    }

    console.log(`${rootDirectoryStats.type} / | ${rootDirectoryStats.cid}`);
    console.log(`${imagesDir.type} /${imagesDir.name} | ${imagesDir.cid}`);
    console.log(
      `${animationDir.type} /${animationDir.name} | ${animationDir.cid}`,
    );

    app.get(
      '/api/upload/:tokenID',
      authMiddlewares.authorizeApiKey,
      upload(minty),
    );

    // if error is not an instanceOf APIError, convert it.
    app.use(error.converter);

    // catch 404 and forward to error handler
    app.use(error.notFound);

    // error handler, send stacktrace only during development
    app.use(error.handler);

    // open mongoose connection

    http.createServer(app).listen(port, () => {
      console.info(`HTTP  Server running on port ${port} (${env})`);
      // console.log(config);
    });

    return app;
  } catch (error) {
    Logger.error(error);
    return process.exit(1);
  }
}

module.exports = init();
