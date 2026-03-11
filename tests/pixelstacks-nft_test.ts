import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
  name: "Can mint NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    let block = chain.mineBlock([
      Tx.contractCall('pixelstacks-nft', 'mint', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);

    block.receipts[0].result.expectOk().expectUint(1);
    assertEquals(block.height, 2);
  },
});

Clarinet.test({
  name: "Can list and buy NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall('pixelstacks-nft', 'mint', [
        types.principal(wallet1.address)
      ], wallet1.address),
    ]);

    block.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall('pixelstacks-nft', 'list-nft', [
        types.uint(1),
        types.uint(2000000)
      ], wallet1.address),
    ]);

    block2.receipts[0].result.expectOk().expectBool(true);

    let block3 = chain.mineBlock([
      Tx.contractCall('pixelstacks-nft', 'buy-nft', [
        types.uint(1)
      ], wallet2.address),
    ]);

    block3.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Cannot buy own NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    let block = chain.mineBlock([
      Tx.contractCall('pixelstacks-nft', 'mint', [
        types.principal(wallet1.address)
      ], wallet1.address),
      Tx.contractCall('pixelstacks-nft', 'list-nft', [
        types.uint(1),
        types.uint(2000000)
      ], wallet1.address),
      Tx.contractCall('pixelstacks-nft', 'buy-nft', [
        types.uint(1)
      ], wallet1.address),
    ]);

    block.receipts[2].result.expectErr().expectUint(100);
  },
});
