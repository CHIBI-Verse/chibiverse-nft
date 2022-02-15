const Chibiverse = artifacts.require('Chibiverse');

module.exports = function (deployer, network, accounts) {
  console.log({
    PREFIX_URI: process.env.PREFIX_URI,
    HIDDEN_URI: process.env.HIDDEN_URI,
    accounts,
    network,
  });

  deployer.deploy(
    Chibiverse,
    process.env.PREFIX_URI,
    '',
    process.env.HIDDEN_URI,
  );
};
