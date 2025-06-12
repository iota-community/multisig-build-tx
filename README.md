# Utils script

Implemented by IOTA Foundation.

## Introduction

This utils provides the following scripts
    - `transferObject.js`: used to transfer some object like AdminCap (based on its ID) to another account like multisig. 
    - `buildTxbMintToAddress.js`: used to build transaction to base64-encoded string that can be input to the multisig interface. The tx here is to call the Admin-privileged `mint_to_address()` function.
    - `buildTxbSwirlStake.js`: used to build transaction to base64-encoded string that can be input to the multisig interface. The tx here is to call the public `stake()` function of Swirl. The sender here is a multisig account.
    - `buildTxbSwirlUnStake.js`: used to build transaction to base64-encoded string that can be input to the multisig interface. The tx here is to call the public `unstake()` function of Swirl. The sender here is a multisig account.
    - `buildTxbReqAddStake.js`: used to build transaction to base64-encoded string that can be input to the multisig interface. The tx here is to call the public `request_add_stake()` function of `iota_system`. The sender here is a multisig account.
    - `buildTxbReqWithdrawStake.js`: used to build transaction to base64-encoded string that can be input to the multisig interface. The tx here is to call the public `request_withdraw_stake()` function of `iota_system`. The sender here is a multisig account.

At the end of this README, several multisig-related test screenshots are attached.

## Install

Run this cmd: `npm i`

## Config

Each script has its own `.env.xyz`

## Transfer object

Use-case is to transfer some object like AdminCap (based on its ID) to another account like multisig or to delete the object by transferring it to the address of zero `0x0000000000000000000000000000000000000000000000000000000000000000`

Run this cmd: `npm run transfer-obj`

**Log output example**

```
> node transferObject.js

Sender address: 0xd3906909a7bfc50ea9f4c0772a75bc99cd0da938c90ec05a556de1b5407bd639
OBJECT_ID: 0x58ede12e5edba88a6a5450b6c23fb1bc50f9fb6a745e044d0e4dccd9417438ac
NEW_OWNER_ACCOUNT_ADDRESS: 0x815604289a27c42440a317631c201cccfab7bbb5f18483ef7f631be8bcf80843
NETWORK: mainnet
Result: {
  digest: '8jv1YF7RXaD85Hnq3NPwAJhoGNNJcXDbe6Bz2PbpTEqK',
  confirmedLocalExecution: false
}
```

## Build tx for multisig

Use-case is to build transaction to base64-encoded string that can be input to the multisig interface.

**Notice**

The multisig account needs to be funded with little IOTA as gas coin. Otherwise, the txb build will fail!

The txb cannot be re-used for the next time after it has been consumed. Means that, need to build again the txb for the next use.

### Mint to address

Config file: `.env.mint.to.address`

Run this cmd: `npm run build-multisig-txb-mint-to-address`

**Log output example**

```
> node buildTxb.js

Build txb result: 000005010058ede12e5edba88a6a5450b6c23fb1bc50f9fb6a745e044d0e4dccd9417438ac462f1d000000000020770a6eba0d870cb28e46de390ae100adb4071a4c829d041f166342cafeb164d20101baa4d286f17c36f478d3858b87d2f2692429579734a8a03f6b055d40aaaab190452f1d0000000000010020d3906909a7bfc50ea9f4c0772a75bc99cd0da938c90ec05a556de1b5407bd639001110736f6d65206465736372697074696f6e00444368747470733a2f2f64333135707664767869326765782e636c6f756466726f6e742e6e65742f643936613333376638346335633930306633316530383830382e706e6701000a1d47c682074fe81c995e0ee15383f12b3049d85d29fc2845986bf2ae4d525d08746573745f6e66740f6d696e745f746f5f616464726573730005010000010100010200010300010400815604289a27c42440a317631c201cccfab7bbb5f18483ef7f631be8bcf80843019edaae736113f348aff806501b4f684f61afd1479b6dbc5cdd6697e4d41319b844291d0000000000209c662460aa67b81dc79263d76a239e0a58612a3fb624eadd4c817e59a772648b815604289a27c42440a317631c201cccfab7bbb5f18483ef7f631be8bcf80843e803000000000000b08353000000000000
```

### Stake to Swirl

Config file: `.env.swirl.stake`

Run this cmd: `npm run build-multisig-txb-swirl-stake`

### Unstake to Swirl

Config file: `.env.swirl.unstake`

Run this cmd: `npm run build-multisig-txb-swirl-unstake`

### request_add_stake

Source: https://docs.iota.org/references/framework/iota-system/iota_system#function-request_add_stake 

Config file: `.env.req.add.stake`

Run this cmd: `npm run build-multisig-txb-request-add-stake`

### request_withdraw_stake

Source: https://docs.iota.org/references/framework/iota-system/iota_system#function-request_withdraw_stake 

Config file: `.env.req.withdraw.stake`

Run this cmd: `npm run build-multisig-txb-request-withdraw-stake`

### Add liquidity of IOTA/stIOTA to pools.finance

Config file: `.env.pools.finance.add.liquidity`

**Notice**

Set/adjust the param `MOVE_FUNCTION_INPUT_AMOUNT_IOTA` for the IOTA tokens to be added to the liquidity pool of IOTA and stIOTA. The stIOTA tokens will auto be determined based on the slippage

Run this cmd: `npm run add-liquidity`

Log output example:

```
IOTA amount: 1000000000
Slippage: 1%
stIOTA amount: 990000000
Dev inspect result: { status: 'success' }
Build txb result: 00000a010001165567ec28726d99b0c73e1167fc8824698c9ea6ed6ad5f1fa34551d532c25f1a5da01000000002091e25fc123217398a7160d52ec832479c11a96ab612b5b2c8610e59bf323e6ef000800ca9a3b000000000100b323b06f988710c2e70febf62dd68eb5e91ea040d92fa7cf0c06e857f5a17abb1db7770100000000207f7deb4d2d7539e6fcb934463453f60f80856e1be793cf9f984ddcb1e43b793600088033023b000000000101464790d0d6cd96c7e1a176d1964244a44567b5798b7f88e9aa92ec79193bb145dc88880200000000010101e7d07303dfdd724d6eaed34f9ee7bda1e9559faa80b44f7db9cf302cffad17b8db8888020000000000000800ca9a3b0000000000088033023b0000000000080000000000000000000800000000000000000302010000010101000201020001010300008f59ae4ad83043ba2aac7c7680d4fd48402df4371b73a81ea69abd4b1d2a6e230b616d6d5f656e74726965730d6164645f6c69717569646974790207000000000000000000000000000000000000000000000000000000000000000204696f746104494f54410007346778989a9f57480ec3fee15f2cd68409c73a62112d40a3efd13987997be68c04636572740443455254000801040001050003000000000301000000010600010700010800010900d8c22c75ac470e99674fd6e73bb92955ce963c3c0b63c0100da3299f91759b070156769dba9fbc6577a785af5770ed33900ac1a65f324747884beedc491a3fd508f1a5da010000000020a477c95ca78f00708d2732ab78e52f966c4ef179575c5dd941d88f1c0b3e0702d8c22c75ac470e99674fd6e73bb92955ce963c3c0b63c0100da3299f91759b07e80300000000000040c761000000000000
```

## Multisig test

![App store to load plain transaction feature](./multisig-screenshots/multisig-1.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-2.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-3.png)

![App store to load plain transaction feature](./multisig-screenshots/multisig-4.png)