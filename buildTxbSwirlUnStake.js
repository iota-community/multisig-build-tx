require('dotenv').config({ path: './.env.swirl.unstake' });
const { toHEX, IOTA_DECIMALS } = require('@iota/iota-sdk/utils');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const BigNumber = require('bignumber.js');

async function main() {
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, MOVE_PACKAGE_ID, MOVE_MODULE, MOVE_MODULE_FUNCTION, MOVE_FUNCTION_INPUT_4, MOVE_FUNCTION_INPUT_1, MOVE_FUNCTION_INPUT_2, MOVE_FUNCTION_INPUT_3 } = process.env;

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const txb = new Transaction();

    // The sender here must be the address of the multisig account
    txb.setSender(MULTISIG_ACCOUNT_ADDRESS);

    let coinResp;
    try {
        coinResp = await client.getCoins({
            owner: MULTISIG_ACCOUNT_ADDRESS,
            coinType: `${MOVE_PACKAGE_ID}::cert::CERT`,
        });
    } catch (err) {
        console.error('Error fetching staked coins:', err);
        return;
    }

    if (coinResp.data.length === 0) {
      toast.error("No staked coins available");
      return;
    }

    const unstakeAmount = new BigNumber(MOVE_FUNCTION_INPUT_4).multipliedBy(10 ** IOTA_DECIMALS).toString();
    const coinFound = coinResp.data.find(
      (coin) => Number(coin.balance) >= Number(unstakeAmount),
    );
    if (coinFound.length === 0) {
      toast.error("No staked coins available");
      return;
    }
    console.log('coinFound:', coinFound);
    const [unstakedCoin] = txb.splitCoins(txb.object(coinFound.coinObjectId), [unstakeAmount]);
    console.log('unstakeAmount:', unstakeAmount);

    // Set the moveCall to the target Move module function
    txb.moveCall({
        target: `${MOVE_PACKAGE_ID}::${MOVE_MODULE}::${MOVE_MODULE_FUNCTION}`,
        arguments: [
            txb.object(MOVE_FUNCTION_INPUT_1),
            txb.object(MOVE_FUNCTION_INPUT_2),
            txb.object(MOVE_FUNCTION_INPUT_3),
            unstakedCoin,
        ],
    });

    // Build a transaction block so that it can be signed or simulated
    const txBytes = await txb.build({ client });

    // Convert txb to hex string which can then be used as input to the multisig interface
    const txBytesHexStr = toHEX(txBytes);

    console.log('Build txb result:', txBytesHexStr);
}

main().catch(err => console.error(err));

