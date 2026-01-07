require('dotenv').config({ path: './.env.pools.finance.add.liquidity' });
const { toHEX, IOTA_DECIMALS } = require('@iota/iota-sdk/utils');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const BigNumber = require('bignumber.js');

const COIN_TYPE_stIOTA = '0x346778989a9f57480ec3fee15f2cd68409c73a62112d40a3efd13987997be68c::cert::CERT';
const COIN_TYPE_IOTA = '0x2::iota::IOTA';
const POOL_IOTA_stIOTA = '0x464790d0d6cd96c7e1a176d1964244a44567b5798b7f88e9aa92ec79193bb145';
const GLOBAL_PAUSE_STATUS = '0xe7d07303dfdd724d6eaed34f9ee7bda1e9559faa80b44f7db9cf302cffad17b8';

async function findCoin(client, owner, coinAmount, coinType) {
    let coinResp;
    try {
        coinResp = await client.getCoins({
            owner,// MULTISIG_ACCOUNT_ADDRESS,
            coinType,
        });
    } catch (err) {
        console.error('findCoin - getCoins - Error:', err?.message);
        return null;
    }

    if (coinResp.data.length === 0) {
        console.error("findCoin - No coins available");
        return null;
    }

    const coinFound = coinResp.data.find(
        (coin) => Number(coin.balance) >= Number(coinAmount),
    );
    if (coinFound.length === 0) {
        console.error("findCoin - No coins with such amount available");
        return null;
    }
    // console.log('coinFound:', coinFound);
    return coinFound;
}

function getSlippageAmount(amount, slippage = 1) {
    console.log(`Slippage: ${slippage}%`);
    const slippageAmount = new BigNumber(amount).multipliedBy(slippage).dividedBy(100);
    return new BigNumber(amount).minus(slippageAmount).toString();
}

async function main() {
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, MOVE_PACKAGE_ID, MOVE_MODULE, MOVE_MODULE_FUNCTION, MOVE_FUNCTION_INPUT_AMOUNT_IOTA, SLIPPAGE } = process.env;

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const txb = new Transaction();

    // The sender here must be the address of the multisig account
    txb.setSender(MULTISIG_ACCOUNT_ADDRESS);

    // Prevents MSafe simulation failures
    txb.setGasBudget(2000000000); // 2 IOTA

    const coinIOTAAmount = new BigNumber(MOVE_FUNCTION_INPUT_AMOUNT_IOTA).multipliedBy(10 ** IOTA_DECIMALS).toString();
    console.log('IOTA amount:', coinIOTAAmount);

    const coinStIOTAAmount = getSlippageAmount(coinIOTAAmount, SLIPPAGE);
    console.log('stIOTA amount:', coinStIOTAAmount);

    const coinIOTAFound = await findCoin(client, MULTISIG_ACCOUNT_ADDRESS, coinIOTAAmount, COIN_TYPE_IOTA);
    if (!coinIOTAFound) {
        return;
    }

    const coinStIOTAFound = await findCoin(client, MULTISIG_ACCOUNT_ADDRESS, coinStIOTAAmount, COIN_TYPE_stIOTA);
    if (!coinStIOTAFound) {
        return;
    }

    const [coinIOTA] = txb.splitCoins(txb.object(coinIOTAFound.coinObjectId), [coinIOTAAmount]);
    // const [coinIOTA] = txb.splitCoins(txb.gas, [coinIOTAAmount]);
    const [coinStIOTA] = txb.splitCoins(txb.object(coinStIOTAFound.coinObjectId), [coinStIOTAAmount]);

    // Set the moveCall to the target Move module function
    txb.moveCall({
        target: `${MOVE_PACKAGE_ID}::${MOVE_MODULE}::${MOVE_MODULE_FUNCTION}`,

        // Must specify typeArguments for generic Move fun add_liquidity<T0, T1>
        typeArguments: [
            COIN_TYPE_IOTA,
            COIN_TYPE_stIOTA,
        ],

        arguments: [
            txb.object(POOL_IOTA_stIOTA),
            txb.object(GLOBAL_PAUSE_STATUS),

            coinIOTA,
            coinStIOTA,

            txb.pure.u64(coinIOTAAmount),
            txb.pure.u64(coinStIOTAAmount),

            txb.pure.u64('0'),
            txb.pure.u64('0'),
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

