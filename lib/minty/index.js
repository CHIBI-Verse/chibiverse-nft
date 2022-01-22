const fs = require('fs/promises');
const path = require('path');

const CID = require('cids');
const ipfsClient = require('ipfs-http-client');
const all = require('it-all');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayToString = require('uint8arrays/to-string');

// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require('getconfig');

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
};

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
async function MakeMinty() {
  const m = new Minty();
  await m.init();
  return m;
}

class Minty {
  constructor() {
    this.ipfs = null;

    this._initialized = false;
    this.ipfsAddOptions = ipfsAddOptions;
  }

  async init() {
    if (this._initialized) {
      return;
    }

    // create a local IPFS node
    this.ipfs = ipfsClient(config.ipfsApiUrl);

    this._initialized = true;
  }

  //////////////////////////////////////////////
  // --------- IPFS helpers
  //////////////////////////////////////////////

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<Uint8Array>} - contents of the IPFS object
   */
  async getIPFS(cidOrURI) {
    const cid = stripIpfsUriPrefix(cidOrURI);
    return uint8ArrayConcat(await all(this.ipfs.cat(cid)));
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - the contents of the IPFS object as a string
   */
  async getIPFSString(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes);
  }

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
   */
  async getIPFSBase64(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes, 'base64');
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
   */
  async getIPFSJSON(cidOrURI) {
    const str = await this.getIPFSString(cidOrURI);
    return JSON.parse(str);
  }

  //////////////////////////////////////////////
  // -------- Pinning to remote services
  //////////////////////////////////////////////

  /**
   * Request that the remote pinning service pin the given CID or ipfs URI.
   *
   * @param {string} cidOrURI - a CID or ipfs:// URI
   * @returns {Promise<void>}
   */
  async pin(cidOrURI) {
    const cid = extractCID(cidOrURI);

    // Make sure IPFS is set up to use our preferred pinning service.
    await this._configurePinningService();

    // Check if we've already pinned this CID to avoid a "duplicate pin" error.
    const pinned = await this.isPinned(cid);
    if (pinned) {
      return;
    }

    // Ask the remote service to pin the content.
    // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
    // and fetch the data using Bitswap, IPFS's transfer protocol.
    await this.ipfs.pin.remote.add(cid, {
      service: config.pinningService.name,
    });
  }

  /**
   * Check if a cid is already pinned.
   *
   * @param {string|CID} cid
   * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
   */
  async isPinned(cid) {
    if (typeof cid === 'string') {
      cid = new CID(cid);
    }

    const opts = {
      service: config.pinningService.name,
      cid: [cid], // ls expects an array of cids
    };
    for await (const result of this.ipfs.pin.remote.ls(opts)) {
      return true;
    }
    return false;
  }

  /**
   * Configure IPFS to use the remote pinning service from our config.
   *
   * @private
   */
  async _configurePinningService() {
    if (!config.pinningService) {
      throw new Error(
        `No pinningService set up in minty config. Unable to pin.`,
      );
    }

    // check if the service has already been added to js-ipfs
    for (const svc of await this.ipfs.pin.remote.service.ls()) {
      if (svc.service === config.pinningService.name) {
        // service is already configured, no need to do anything
        return;
      }
    }

    // add the service to IPFS
    const { name, endpoint, key } = config.pinningService;
    if (!name) {
      throw new Error('No name configured for pinning service');
    }
    if (!endpoint) {
      throw new Error(`No endpoint configured for pinning service ${name}`);
    }
    if (!key) {
      throw new Error(
        `No key configured for pinning service ${name}.` +
          `If the config references an environment variable, e.g. '$$PINATA_API_TOKEN', ` +
          `make sure that the variable is defined.`,
      );
    }
    await this.ipfs.pin.remote.service.add(name, { endpoint, key });
  }

  //////////////////////////////////////////////
  // -------- URI helpers
  //////////////////////////////////////////////

  /**
   * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
   * @returns the input string with the `ipfs://` prefix stripped off
   */
  stripIpfsUriPrefix(cidOrURI) {
    if (cidOrURI.startsWith('ipfs://')) {
      return cidOrURI.slice('ipfs://'.length);
    }
    return cidOrURI;
  }

  ensureIpfsUriPrefix(cidOrURI) {
    let uri = cidOrURI.toString();
    if (!uri.startsWith('ipfs://')) {
      uri = 'ipfs://' + cidOrURI;
    }
    // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
    if (uri.startsWith('ipfs://ipfs/')) {
      uri = uri.replace('ipfs://ipfs/', 'ipfs://');
    }
    return uri;
  }

  /**
   * Return an HTTP gateway URL for the given IPFS object.
   * @param {string} ipfsURI - an ipfs:// uri or CID string
   * @returns - an HTTP url to view the IPFS object on the configured gateway.
   */
  makeGatewayURL(ipfsURI) {
    return config.ipfsGatewayUrl + '/' + stripIpfsUriPrefix(ipfsURI);
  }

  /**
   *
   * @param {string} cidOrURI - an ipfs:// URI or CID string
   * @returns {CID} a CID for the root of the IPFS path
   */
  extractCID(cidOrURI) {
    // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
    const cidString = stripIpfsUriPrefix(cidOrURI).split('/')[0];
    return new CID(cidString);
  }
}

//////////////////////////////////////////////
// -------- URI helpers
//////////////////////////////////////////////

/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
function stripIpfsUriPrefix(cidOrURI) {
  if (cidOrURI.startsWith('ipfs://')) {
    return cidOrURI.slice('ipfs://'.length);
  }
  return cidOrURI;
}

function ensureIpfsUriPrefix(cidOrURI) {
  let uri = cidOrURI.toString();
  if (!uri.startsWith('ipfs://')) {
    uri = 'ipfs://' + cidOrURI;
  }
  // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
  if (uri.startsWith('ipfs://ipfs/')) {
    uri = uri.replace('ipfs://ipfs/', 'ipfs://');
  }
  return uri;
}

/**
 * Return an HTTP gateway URL for the given IPFS object.
 * @param {string} ipfsURI - an ipfs:// uri or CID string
 * @returns - an HTTP url to view the IPFS object on the configured gateway.
 */
function makeGatewayURL(ipfsURI) {
  return config.ipfsGatewayUrl + '/' + stripIpfsUriPrefix(ipfsURI);
}

/**
 *
 * @param {string} cidOrURI - an ipfs:// URI or CID string
 * @returns {CID} a CID for the root of the IPFS path
 */
function extractCID(cidOrURI) {
  // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
  const cidString = stripIpfsUriPrefix(cidOrURI).split('/')[0];
  return new CID(cidString);
}

//////////////////////////////////////////////
// -------- Exports
//////////////////////////////////////////////

module.exports = {
  MakeMinty,
};
