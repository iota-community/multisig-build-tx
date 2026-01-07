require('dotenv').config({ path: './.env.swirl.stake' });
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

    // Prevents MSafe simulation failures
    txb.setGasBudget(2000000000); // 2 IOTA

    let coinResp;
    try {
        coinResp = await client.getCoins({
            owner: MULTISIG_ACCOUNT_ADDRESS,
        });
    } catch (err) {
        console.error('Error fetching staked coins:', err);
        return;
    }

    if (coinResp.data.length === 0) {
        console.error("No staked coins available");
        return;
    }

    const stakeAmount = new BigNumber(MOVE_FUNCTION_INPUT_4).multipliedBy(10 ** IOTA_DECIMALS).toString();
    const coinFound = coinResp.data.find(
        (coin) => Number(coin.balance) >= Number(stakeAmount),
    );
    if (coinFound.length === 0) {
        console.error("No staked coins available");
        return;
    }
    console.log('coinFound:', coinFound);

    const [stakedCoin] = txb.splitCoins(txb.object(coinFound.coinObjectId), [stakeAmount]);

    console.log('stakeAmount:', stakeAmount);
    console.log('stakedCoin:', stakedCoin);

    // Set the moveCall to the target Move module function
    txb.moveCall({
        target: `${MOVE_PACKAGE_ID}::${MOVE_MODULE}::${MOVE_MODULE_FUNCTION}`,
        arguments: [
            txb.object(MOVE_FUNCTION_INPUT_1),
            txb.object(MOVE_FUNCTION_INPUT_2),
            txb.object(MOVE_FUNCTION_INPUT_3),
            stakedCoin,
        ],
    });

    const res = await client.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: MULTISIG_ACCOUNT_ADDRESS,
    });
    console.log('Dev inspect result:', res.effects.status);

    // Build a transaction block so that it can be signed or simulated
    const txBytes = await txb.build({ client });

    // Convert txb to hex string which can then be used as input to the multisig interface
    const txBytesHexStr = toHEX(txBytes);

    console.log('Build txb result:', txBytesHexStr);
}

main().catch(err => console.error(err));

