# Utils script

Implemented by IOTA Foundation.

## Introduction

This utils provides 2 scripts:
    - `transferObject.js`: used to transfer some object like AdminCap (based on its ID) to another account like multisig. 
    - `buildTxb.js`: used to build transaction to base64-encoded string that can be input to the multisig interface.

At the end of this README, several multisig-related test screenshots are attached.

## Install

Run this cmd: `npm i`

## Config

Copy the `.env.example` to `.env` and edit accordingly

## Transfer object

Use-case is to transfer some object like AdminCap (based on its ID) to another account like multisig or to delete the object by transferring it to the address of zero `0x0000000000000000000000000000000000000000000000000000000000000000`

Run this cmd: `npm run transfer-obj`

**Log output example**

```
Result: {
  digest: 'HZP8mYLpUcSy25cZs22CTfiFZB1o9tKCTPUhiFBhZfhr',
  confirmedLocalExecution: false
}
```

## Build tx for multisig

Use-case is to build transaction to base64-encoded string that can be input to the multisig interface.

**Notice**

The multisig account needs to be funded with little IOTA as gas coin. Otherwise, the txb build will fail!

The txb cannot be re-used for the next time after it has been consumed. Means that, need to build again the txb for the next use.

Run this cmd: `npm run build-multisig-txb`

**Log output example**

```
Build txb result: 0000050100fc5232e0a318d105b1dd878cfc7ecbb9d65a4c0fcc63776ab82d09dc07cef2b88371c40d0000000020ff21ea788feb3721c5b9941e9868bf7e1e1aa768f0718082e706a2effbcbbbfe0101ca474f8a9c06b3b8d33e1ec3dbfe661304295eca2bc1b972b67ca098aa55b52c8271c40d00000000010020d3906909a7bfc50ea9f4c0772a75bc99cd0da938c90ec05a556de1b5407bd639001110736f6d65206465736372697074696f6e00444368747470733a2f2f64333135707664767869326765782e636c6f756466726f6e742e6e65742f643936613333376638346335633930306633316530383830382e706e6701006ed4238d5cf2b9e16d3bf571e52bfe3c680cd49814419c30136cac99a5d90dfe0b726562617365645f6e66740f6d696e745f746f5f6164647265737300050100000101000102000103000104005eef394517b2fbc2bf186537c8c02f832439e467f3fcc9150670bbdbd38a7db0019c08caf9f582167845b7c013e000e5dac98b585398bca19d796a287a65a94d979f57de0d0000000020bde491505723c711255439f094977010147ddaad4dead393f7aa316fb83cd9f95eef394517b2fbc2bf186537c8c02f832439e467f3fcc9150670bbdbd38a7db0e803000000000000d03554000000000000
```

## Multisig test

![App store to load plain transaction feature](./multisig-screenshots/multisig-1.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-2.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-3.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-4.png)