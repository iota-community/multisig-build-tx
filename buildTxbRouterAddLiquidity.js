require("dotenv").config({ path: "./.env.router.add.liquidity" });
const { toHEX } = require("@iota/iota-sdk/utils");
const { Transaction } = require("@iota/iota-sdk/transactions");
const { IotaClient, getFullnodeUrl } = require("@iota/iota-sdk/client");
const BigNumber = require("bignumber.js");

const COIN_TYPE_VUSD =
  "0xd3b63e603a78786facf65ff22e79701f3e824881a12fa3268d62a75530fe904f::vusd::VUSD";

// VUSD uses 6 decimals
// https://iotascan.com/mainnet/coin/0xd3b63e603a78786facf65ff22e79701f3e824881a12fa3268d62a75530fe904f::vusd::VUSD
const COIN_TYPE_VUSD_DECIMALS = 6;

const LiquidityPoolConfig =
  "0xc0fb85e46ddd340801952ecc58f233218c7ef48ebee6744d793e7a447299afec";
const LiquidityPool =
  "0x2c90b7d4bcd33eb661d3d2275f0dc3ced5c78c64cc809585ec0cb159f77edcf5";
const GlobalVault =
  "0x3f989e9cc1a6f28442418f116ff26423e0e6a91f65f0808075d798212f295ddb";

async function findCoin(client, owner, coinAmount, coinType) {
  let coinResp;
  try {
    coinResp = await client.getCoins({
      owner, // MULTISIG_ACCOUNT_ADDRESS,
      coinType,
    });
  } catch (err) {
    console.error("findCoin - getCoins - Error:", err?.message);
    return null;
  }

  if (coinResp.data.length === 0) {
    console.error("findCoin - No coins available");
    return null;
  }

  const coinFound = coinResp.data.find(
    (coin) => Number(coin.balance) >= Number(coinAmount)
  );
  if (coinFound.length === 0) {
    console.error("findCoin - No coins with such amount available");
    return null;
  }
  // console.log('coinFound:', coinFound);
  return coinFound;
}

async function main() {
  const {
    NETWORK,
    MULTISIG_ACCOUNT_ADDRESS,
    MOVE_PACKAGE_ID,
    MOVE_MODULE,
    MOVE_MODULE_FUNCTION,
    MOVE_FUNCTION_INPUT_AMOUNT_VUSD,
  } = process.env;

  const client = new IotaClient({
    url:
      getFullnodeUrl(NETWORK) ||
      (NETWORK === "mainnet"
        ? "https://api.mainnet.iota.cafe"
        : "https://api.testnet.iota.cafe"),
  });

  const txb = new Transaction();

  // The sender here must be the address of the multisig account
  txb.setSender(MULTISIG_ACCOUNT_ADDRESS);

  const coinVUSDAmount = new BigNumber(MOVE_FUNCTION_INPUT_AMOUNT_VUSD)
    .multipliedBy(10 ** COIN_TYPE_VUSD_DECIMALS)
    .toString();
  console.log("VUSD amount:", MOVE_FUNCTION_INPUT_AMOUNT_VUSD);

  const coinVUSDFound = await findCoin(
    client,
    MULTISIG_ACCOUNT_ADDRESS,
    coinVUSDAmount,
    COIN_TYPE_VUSD
  );
  if (!coinVUSDFound) {
    return;
  }

  const [coinVUSD] = txb.splitCoins(txb.object(coinVUSDFound.coinObjectId), [
    coinVUSDAmount,
  ]);

  // Set the moveCall to the target Move module function
  txb.moveCall({
    target: `${MOVE_PACKAGE_ID}::${MOVE_MODULE}::${MOVE_MODULE_FUNCTION}`,

    typeArguments: [COIN_TYPE_VUSD],

    arguments: [
      txb.object(LiquidityPoolConfig),
      txb.object(LiquidityPool),
      txb.object(GlobalVault),
      coinVUSD,
      txb.pure.u64("0"),
    ],
  });

  const res = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: MULTISIG_ACCOUNT_ADDRESS,
  });
  console.log("Dev inspect result:", res.effects.status);

  // Build a transaction block so that it can be signed or simulated
  const txBytes = await txb.build({ client });

  // Convert txb to hex string which can then be used as input to the multisig interface
  const txBytesHexStr = toHEX(txBytes);

  console.log("Build txb result:", txBytesHexStr);
}

main().catch((err) => console.error(err));
