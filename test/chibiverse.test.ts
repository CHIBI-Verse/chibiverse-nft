import expect from 'expect';
import ganache from 'ganache-cli';
import { AbiItem } from 'web3-utils';
import { ChibiVerse } from '../types/web3-v1-contracts/ChibiVerse';
import ChibiVerseContract from '../build/contracts/ChibiVerse.json';
import { beforeEach, describe, it, jest } from '@jest/globals';
import {
  getWeb3,
  toWei,
  toBasis,
  toBN,
  fromWei,
  zeroBN,
  toBytes32,
  fromBytes32,
} from '../utils/util';
import { testActors } from '../utils/test_util';

const ganacheOpts = {
  // verbose: true,
  // logger: console,
  mnemonic: `${process.env.SEED_GANACHE}`,
};
const web3 = getWeb3(ganache.provider(ganacheOpts));

let chibiVerse: ChibiVerse;

beforeEach(async () => {
  const actors = await testActors(web3);

  // 1. Deploy theLand contract
  chibiVerse = new web3.eth.Contract(
    ChibiVerseContract.abi as AbiItem[],
  ) as any as ChibiVerse;

  chibiVerse = (await chibiVerse
    .deploy({ data: ChibiVerseContract.bytecode, arguments: [] })
    .send(actors.ownerTx)) as any as ChibiVerse;

  // 2. Get address of the land contract
  const chibiVerseAddr = chibiVerse.options.address;

  // console.log(`ChibiVerseAddr = `, { chibiVerseAddr });

  await chibiVerse.methods.setPaused(false).send(actors.ownerTx);

  await chibiVerse.methods.setRevealed(true).send(actors.ownerTx);
});

describe('Mint', () => {
  it('can mint', async () => {
    const actors = await testActors(web3);

    const amount = 2;

    // let isPaused = await chibiVerse.methods.paused().call();
    // console.log(isPaused);

    let totalSupplyBeforeMint = await chibiVerse.methods.totalSupply().call();
    // console.log({ totalSupplyBeforeMint });

    let walletBeforeMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    // console.log({ walletBeforeMint });

    let cost = await chibiVerse.methods.cost().call();
    // console.log(cost);

    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: Number(cost) * amount });

    let walletAfterMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    // console.log({ walletAfterMint });

    let totalSupplyAfterMint = await chibiVerse.methods.totalSupply().call();
    // console.log({ totalSupplyAfterMint });

    expect(walletAfterMint.length - walletBeforeMint.length).toEqual(amount);
    expect(
      Number(totalSupplyAfterMint) - Number(totalSupplyBeforeMint),
    ).toEqual(amount);
  });
});
