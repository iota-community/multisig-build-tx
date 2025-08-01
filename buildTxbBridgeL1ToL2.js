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
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, MOVE_PACKAGE_ID, L1_CHAIN_ID, TOKEN_COIN_TYPE, TOKEN_COIN_DECIMALS, TOKEN_AMOUNT, EVM_RECIPIENT, IS_IOTA_TOKEN } = process.env;

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
            coinType: IS_IOTA_TOKEN === 'true' ? null : TOKEN_COIN_TYPE,
        });
    } catch (err) {
        console.error('Error fetching coins:', err);
        return;
    }

    const noAvailableCoinsMsg = IS_IOTA_TOKEN === 'true'
        ? 'No available IOTA coins'
        : `No available coins of type ${TOKEN_COIN_TYPE}`;

    const decimals = IS_IOTA_TOKEN === 'true' ? 9 : Number(TOKEN_COIN_DECIMALS);
    console.log('decimals:', decimals);
    console.log('TOKEN_AMOUNT:', TOKEN_AMOUNT);

    if (coinResp.data.length === 0) {
        console.error(noAvailableCoinsMsg);
        return;
    }

    const tokenAmount = new BigNumber(TOKEN_AMOUNT).multipliedBy(10 ** decimals).toString();
    const coinFound = coinResp.data.find(
        (coin) => Number(coin.balance) >= Number(tokenAmount),
    );
    if (!coinFound || coinFound.length === 0) {
        console.error(`${noAvailableCoinsMsg} with sufficient balance`);
        return;
    }
    console.log('coinFound:', coinFound);
    
    // In case of transferring custom token, must place 0.01 IOTA as gas coin for extra payment required by the bridge process!
    const iotaCoinAmount = IS_IOTA_TOKEN === 'true' ? tokenAmount : BigInt(1 * 1_000_000);
    const L2_FROM_L1_GAS_BUDGET = 1000000n;
    const iotaCoin = iscTx.coinFromAmount({ amount: iotaCoinAmount + L2_FROM_L1_GAS_BUDGET });
    iscTx.placeCoinInBag({ coin: iotaCoin, bag, coinType: IOTA_TYPE_ARG });

    // Place custom token    
    if (IS_IOTA_TOKEN !== 'true') {
        const [coinToBeBridged] = tx.splitCoins(tx.object(coinFound.coinObjectId), [tokenAmount]);
        iscTx.placeCoinInBag({ coin: coinToBeBridged, bag, coinType: TOKEN_COIN_TYPE });
    }

    if (IS_IOTA_TOKEN === 'true') {
        iscTx.createAndSendToEvm({
            bag,
            transfers: [
                [IOTA_TYPE_ARG, iotaCoinAmount]
            ],
            address: EVM_RECIPIENT,
            accountsContract: getHname(CoreContract.Accounts),
            accountsFunction: getHname(AccountsContractMethod.TransferAllowanceTo),
        });
    } else {
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
    }

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

