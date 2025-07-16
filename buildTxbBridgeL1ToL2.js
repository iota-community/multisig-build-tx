require('dotenv').config({ path: './.env.bridge.L1.To.L2' });
const { toHEX, IOTA_TYPE_ARG } = require('@iota/iota-sdk/utils');
require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const BigNumber = require('bignumber.js');
const {
    AccountsContractMethod,
    CoreContract,
    getHname,
    IscTransaction,
} = require('@iota/isc-sdk');

async function main() {
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, MOVE_PACKAGE_ID, L1_CHAIN_ID, TOKEN_COIN_TYPE, TOKEN_COIN_DECIMALS, TOKEN_AMOUNT, EVM_RECIPIENT } = process.env;

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const iscTx = new IscTransaction({
        packageId: MOVE_PACKAGE_ID,
        chainId: L1_CHAIN_ID,
    });
    const tx = iscTx.transaction();
    const bag = iscTx.newBag();

    let coinResp;
    try {
        coinResp = await client.getCoins({
            owner: MULTISIG_ACCOUNT_ADDRESS,
            coinType: TOKEN_COIN_TYPE,
        });
    } catch (err) {
        console.error('Error fetching coins:', err);
        return;
    }

    if (coinResp.data.length === 0) {
        console.error(`No available coins of type ${TOKEN_COIN_TYPE}`);
        return;
    }

    const tokenAmount = new BigNumber(TOKEN_AMOUNT).multipliedBy(10 ** TOKEN_COIN_DECIMALS).toString();
    const coinFound = coinResp.data.find(
        (coin) => Number(coin.balance) >= Number(tokenAmount),
    );
    if (coinFound.length === 0) {
        console.error(`No available coins of type ${TOKEN_COIN_TYPE} with sufficient balance`);
        return;
    }
    console.log('coinFound:', coinFound);
    const [tokenToBeBridged] = tx.splitCoins(tx.object(coinFound.coinObjectId), [tokenAmount]);

    // Place 0.01 IOTA as gas coin for extra payment required by the bridge process!
    const iotaCoinAmount = BigInt(1 * 1_000_000);
    const L2_FROM_L1_GAS_BUDGET = 1000000n;
    const iotaCoin = iscTx.coinFromAmount({ amount: iotaCoinAmount + L2_FROM_L1_GAS_BUDGET });
    iscTx.placeCoinInBag({ coin: iotaCoin, bag, coinType: IOTA_TYPE_ARG });

    // Place token
    iscTx.placeCoinInBag({ coin: tokenToBeBridged, bag, coinType: TOKEN_COIN_TYPE });

    iscTx.createAndSendToEvm({
        bag,
        transfers: [
            // Extra IOTA gas coin for the bridge process!
            [IOTA_TYPE_ARG, iotaCoinAmount],
            
            [TOKEN_COIN_TYPE, tokenAmount],
        ],
        address: EVM_RECIPIENT,
        accountsContract: getHname(CoreContract.Accounts),
        accountsFunction: getHname(AccountsContractMethod.TransferAllowanceTo),
    });

    const transaction = iscTx.build();
    transaction.setSender(MULTISIG_ACCOUNT_ADDRESS);

    const res = await client.devInspectTransactionBlock({
        transactionBlock: transaction,
        sender: MULTISIG_ACCOUNT_ADDRESS,
    });
    console.log('Dev inspect result:', res.effects.status);

    const txBytes = await transaction.build({ client });

    // Convert tx to hex string which can then be used as input to the multisig interface
    const txBytesHexStr = toHEX(txBytes);

    console.log('Build tx result:', txBytesHexStr);
}

main().catch(err => console.error(err));

