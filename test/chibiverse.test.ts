import _ from 'lodash';
import expect from 'expect';
import ganache from 'ganache-cli';
import { AbiItem } from 'web3-utils';
import { ChibiVerse } from '../types/web3-v1-contracts/ChibiVerse';
import ChibiVerseContract from '../build/contracts/ChibiVerse.json';
import { beforeEach, describe, it, jest } from '@jest/globals';
import { getWeb3 } from '../utils/util';
import { testActors } from '../utils/test_util';

const prefixUri = 'ipfs://__CID__/';

const ganacheOpts = {
  // verbose: true,
  // logger: console,
  mnemonic: `${process.env.SEED_GANACHE}`,
};

const web3 = getWeb3(ganache.provider(ganacheOpts));

let chibiVerse: ChibiVerse;

beforeEach(async () => {
  const actors = await testActors(web3);

  // 1. Deploy contract
  chibiVerse = new web3.eth.Contract(
    ChibiVerseContract.abi as AbiItem[],
  ) as any as ChibiVerse;

  chibiVerse = (await chibiVerse
    .deploy({
      data: ChibiVerseContract.bytecode,
      arguments: [prefixUri, ''],
    })
    .send(actors.ownerTx)) as any as ChibiVerse;

  // 2. Get address of the contract
  const chibiVerseAddr = chibiVerse.options.address;

  // console.log(`ChibiVerseAddr = `, chibiVerseAddr);

  // await chibiVerse.methods.unpause().send(actors.ownerTx);
});

describe('Mint', () => {
  it('first mint token id must be 1', async () => {
    const actors = await testActors(web3);
    const amount = 1;
    let cost = await chibiVerse.methods.PRICE().call();
    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: Number(cost) * amount });
    let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
    expect(tokenID1Owner).toEqual(actors.acc1Addr);
  });
  it('can not pay less than price', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        const amount = 2;
        let cost = await chibiVerse.methods.PRICE().call();
        // Mint
        await chibiVerse.methods
          .mint(amount)
          .send({ ...actors.acc1Tx, value: Number(cost) });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Insufficient funds!');
  });
  it('can mint many', async () => {
    const actors = await testActors(web3);
    const amount = 2;
    let totalSupplyBeforeMint = await chibiVerse.methods.totalSupply().call();
    let walletBeforeMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    let cost = await chibiVerse.methods.PRICE().call();
    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: Number(cost) * amount });
    let walletAfterMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    let totalSupplyAfterMint = await chibiVerse.methods.totalSupply().call();
    expect(walletAfterMint.length - walletBeforeMint.length).toEqual(amount);
    expect(
      Number(totalSupplyAfterMint) - Number(totalSupplyBeforeMint),
    ).toEqual(amount);
  });
  it('can not mint over 20 per tx', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        const amount = 21;
        let cost = await chibiVerse.methods.PRICE().call();
        // Mint
        await chibiVerse.methods
          .mint(amount)
          .send({ ...actors.acc1Tx, value: Number(cost) * amount });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Invalid mint amount!');
  });
  it('total supply = n, can not mint over max supply', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let cost = await chibiVerse.methods.PRICE().call();
        let maxSupply = await chibiVerse.methods.MAX_CHIBI().call();
        let maxAmountPerTX = await chibiVerse.methods
          .MAX_CHIBI_PURCHASE()
          .call();
        const round = Number(maxSupply) / Number(maxAmountPerTX);
        const tx = _.times(round, (i) => {
          let amount = Number(maxAmountPerTX);
          return chibiVerse.methods
            .mint(amount)
            .send({ ...actors.acc1Tx, value: Number(cost) * amount });
        });
        await Promise.all(tx);
        let totalSupply = await chibiVerse.methods.totalSupply().call();
        expect(Number(totalSupply)).toEqual(Number(maxSupply));
        await chibiVerse.methods
          .mint(1)
          .send({ ...actors.acc1Tx, value: Number(cost) * 1 });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Max supply exceeded!');
  });
  it('total supply = n - 1, can not mint over max supply', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let cost = await chibiVerse.methods.PRICE().call();
        let maxSupply = await chibiVerse.methods.MAX_CHIBI().call();
        let maxAmountPerTX = await chibiVerse.methods
          .MAX_CHIBI_PURCHASE()
          .call();
        const round = Number(maxSupply) / Number(maxAmountPerTX);
        const tx = _.times(round, (i) => {
          let amount = Number(maxAmountPerTX);
          // last round
          if (i + 1 === round) {
            amount = Number(maxAmountPerTX) - 1;
          }
          return chibiVerse.methods
            .mint(amount)
            .send({ ...actors.acc1Tx, value: Number(cost) * amount });
        });
        await Promise.all(tx);
        let totalSupply = await chibiVerse.methods.totalSupply().call();
        expect(Number(totalSupply)).toEqual(Number(maxSupply) - 1);
        // last mint
        await chibiVerse.methods
          .mint(1)
          .send({ ...actors.acc1Tx, value: Number(cost) * 1 });
        let totalSupplyAfterLastMint = await chibiVerse.methods
          .totalSupply()
          .call();
        expect(Number(totalSupplyAfterLastMint)).toEqual(Number(maxSupply));
        await chibiVerse.methods
          .mint(1)
          .send({ ...actors.acc1Tx, value: Number(cost) * 1 });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Max supply exceeded!');
  });
  it('total supply = n - 1, can not mint many over max supply', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let cost = await chibiVerse.methods.PRICE().call();
        let maxSupply = await chibiVerse.methods.MAX_CHIBI().call();
        let maxAmountPerTX = await chibiVerse.methods
          .MAX_CHIBI_PURCHASE()
          .call();
        const round = Number(maxSupply) / Number(maxAmountPerTX);
        const tx = _.times(round, (i) => {
          let amount = Number(maxAmountPerTX);
          // last round
          if (i + 1 === round) {
            amount = Number(maxAmountPerTX) - 1;
          }
          return chibiVerse.methods
            .mint(amount)
            .send({ ...actors.acc1Tx, value: Number(cost) * amount });
        });
        await Promise.all(tx);
        let totalSupply = await chibiVerse.methods.totalSupply().call();
        expect(Number(totalSupply)).toEqual(Number(maxSupply) - 1);
        await chibiVerse.methods
          .mint(2)
          .send({ ...actors.acc1Tx, value: Number(cost) * 2 });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Max supply exceeded!');
  });
});

describe('Revealed', () => {
  it('uri must be hidden if not revealed', async () => {
    const actors = await testActors(web3);
    const revealed = await chibiVerse.methods.revealed().call();
    expect(revealed).toEqual(false);
    const amount = 1;
    let cost = await chibiVerse.methods.PRICE().call();
    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: Number(cost) * amount });
    let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
    expect(tokenID1Owner).toEqual(actors.acc1Addr);
    let tokenUri = await chibiVerse.methods.tokenURI(1).call();
    expect(tokenUri).toContain('hidden');
  });
  it('can set revealed', async () => {
    const actors = await testActors(web3);
    let revealed = await chibiVerse.methods.revealed().call();
    expect(revealed).toEqual(false);
    await chibiVerse.methods.setRevealed().send(actors.ownerTx);
    revealed = await chibiVerse.methods.revealed().call();
    expect(revealed).toEqual(true);
  });
  it('uri must be public tokenId if revealed', async () => {
    const actors = await testActors(web3);
    await chibiVerse.methods.setRevealed().send(actors.ownerTx);
    let revealed = await chibiVerse.methods.revealed().call();
    expect(revealed).toEqual(true);
    const amount = 1;
    let cost = await chibiVerse.methods.PRICE().call();
    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: Number(cost) * amount });
    let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
    expect(tokenID1Owner).toEqual(actors.acc1Addr);
    let tokenUri = await chibiVerse.methods.tokenURI(1).call();
    expect(tokenUri).toEqual(`${prefixUri}1`);
  });
});

describe('Pause', () => {
  it('can pause', async () => {
    const actors = await testActors(web3);
    let paused = await chibiVerse.methods.paused().call();
    expect(paused).toEqual(false);
    await chibiVerse.methods.pause().send(actors.ownerTx);
    paused = await chibiVerse.methods.paused().call();
    expect(paused).toEqual(true);
  });
  it('can unpause', async () => {
    const actors = await testActors(web3);
    let paused = await chibiVerse.methods.paused().call();
    expect(paused).toEqual(false);
    await chibiVerse.methods.pause().send(actors.ownerTx);
    paused = await chibiVerse.methods.paused().call();
    expect(paused).toEqual(true);
    await chibiVerse.methods.unpause().send(actors.ownerTx);
    paused = await chibiVerse.methods.paused().call();
    expect(paused).toEqual(false);
  });
  it('can pause only owner', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        await chibiVerse.methods.pause().send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('not the owner');
  });
  it('can unpause only owner', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        await chibiVerse.methods.unpause().send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('not the owner');
  });
  it('can not mint when pause', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        await chibiVerse.methods.pause().send(actors.ownerTx);
        const paused = await chibiVerse.methods.paused().call();
        expect(paused).toEqual(true);
        const amount = 1;
        let cost = await chibiVerse.methods.PRICE().call();
        // Mint
        await chibiVerse.methods
          .mint(amount)
          .send({ ...actors.acc1Tx, value: Number(cost) * amount });
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('is paused!');
  });
});

describe('Giveaway', () => {
  it('can add address to giveaway list', async () => {
    const actors = await testActors(web3);
    let claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(false);
    await chibiVerse.methods
      .addToGiveawayList(actors.acc1Addr)
      .send(actors.ownerTx);
    claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(true);
  });
  it('can remove address from giveaway list', async () => {
    const actors = await testActors(web3);
    let claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(false);
    await chibiVerse.methods
      .addToGiveawayList(actors.acc1Addr)
      .send(actors.ownerTx);
    claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(true);
    await chibiVerse.methods
      .removeGiveawayList(actors.acc1Addr)
      .send(actors.ownerTx);
    claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(false);
  });
  it('can add address to giveaway list only owner', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        await chibiVerse.methods
          .addToGiveawayList(actors.acc1Addr)
          .send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('not the owner');
  });
  it('can remove address from giveaway list only owner', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        await chibiVerse.methods
          .removeGiveawayList(actors.acc1Addr)
          .send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('not the owner');
  });
  it('can claim giveaway', async () => {
    const actors = await testActors(web3);
    let claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(false);
    await chibiVerse.methods
      .addToGiveawayList(actors.acc1Addr)
      .send(actors.ownerTx);
    claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
    expect(claimable).toEqual(true);
    let walletBeforeMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    expect(walletBeforeMint.length).toEqual(0);
    // Mint
    await chibiVerse.methods.claim().send(actors.acc1Tx);
    let walletAfterMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    expect(walletAfterMint.length - walletBeforeMint.length).toEqual(1);
    let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
    expect(tokenID1Owner).toEqual(actors.acc1Addr);
  });
  it('can not claim giveaway again', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let claimable = await chibiVerse.methods
          .claimable(actors.acc1Addr)
          .call();
        expect(claimable).toEqual(false);
        await chibiVerse.methods
          .addToGiveawayList(actors.acc1Addr)
          .send(actors.ownerTx);
        claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
        expect(claimable).toEqual(true);
        let walletBeforeMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();
        expect(walletBeforeMint.length).toEqual(0);
        // Mint
        await chibiVerse.methods.claim().send(actors.acc1Tx);
        let walletAfterMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();
        expect(walletAfterMint.length - walletBeforeMint.length).toEqual(1);
        let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
        expect(tokenID1Owner).toEqual(actors.acc1Addr);
        claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
        expect(claimable).toEqual(false);
        // Mint
        await chibiVerse.methods.claim().send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow("Don't claim again!");
  });
  it('can claim only giveaway listed', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let claimable = await chibiVerse.methods
          .claimable(actors.acc1Addr)
          .call();
        expect(claimable).toEqual(false);
        // Mint
        await chibiVerse.methods.claim().send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('Only giveaway listed!');
  });
  it('can not add address to giveaway list again', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);
        let claimable = await chibiVerse.methods
          .claimable(actors.acc1Addr)
          .call();
        expect(claimable).toEqual(false);
        await chibiVerse.methods
          .addToGiveawayList(actors.acc1Addr)
          .send(actors.ownerTx);
        claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
        expect(claimable).toEqual(true);
        let walletBeforeMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();
        expect(walletBeforeMint.length).toEqual(0);
        // Mint
        await chibiVerse.methods.claim().send(actors.acc1Tx);
        let walletAfterMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();
        expect(walletAfterMint.length - walletBeforeMint.length).toEqual(1);
        let tokenID1Owner = await chibiVerse.methods.ownerOf(1).call();
        expect(tokenID1Owner).toEqual(actors.acc1Addr);
        claimable = await chibiVerse.methods.claimable(actors.acc1Addr).call();
        expect(claimable).toEqual(false);
        // Mint
        await chibiVerse.methods
          .addToGiveawayList(actors.acc1Addr)
          .send(actors.ownerTx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow("Don't claim again!");
  });
});

describe('Withdraw', () => {
  it('can withdraw', async () => {
    const actors = await testActors(web3);

    let balanceBeforeWithdraw = await web3.eth.getBalance(actors.ownerAddr);

    const amount = 10;

    let walletBeforeMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();
    let cost = await chibiVerse.methods.PRICE().call();

    const totalPrice = Number(cost) * amount;

    // Mint
    await chibiVerse.methods
      .mint(amount)
      .send({ ...actors.acc1Tx, value: totalPrice });

    let walletAfterMint = await chibiVerse.methods
      .walletOfOwner(actors.acc1Addr)
      .call();

    expect(walletAfterMint.length - walletBeforeMint.length).toEqual(amount);

    await chibiVerse.methods.withdraw().send(actors.ownerTx);

    let balanceAfterWithdraw = await web3.eth.getBalance(actors.ownerAddr);

    expect(Number(balanceAfterWithdraw)).toBeGreaterThan(
      Number(balanceBeforeWithdraw),
    );
  });

  it('can withdraw only owner', async () => {
    await expect(async () => {
      try {
        const actors = await testActors(web3);

        const amount = 10;

        let walletBeforeMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();
        let cost = await chibiVerse.methods.PRICE().call();

        const totalPrice = Number(cost) * amount;

        // Mint
        await chibiVerse.methods
          .mint(amount)
          .send({ ...actors.acc1Tx, value: totalPrice });

        let walletAfterMint = await chibiVerse.methods
          .walletOfOwner(actors.acc1Addr)
          .call();

        expect(walletAfterMint.length - walletBeforeMint.length).toEqual(
          amount,
        );

        await chibiVerse.methods.withdraw().send(actors.acc1Tx);
      } catch (error) {
        throw error;
      }
    }).rejects.toThrow('not the owner');
  });
});
