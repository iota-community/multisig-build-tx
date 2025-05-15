require('dotenv').config({ path: './.env.mint.to.address' });
const { toHEX } = require('@iota/iota-sdk/utils');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');

async function main() {
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, MOVE_PACKAGE_ID, MOVE_MODULE, MOVE_MODULE_FUNCTION, MOVE_FUNCTION_ARG_ADMIN_CAP_ID, MOVE_FUNCTION_ARG_NFT_DATA_ID, MOVE_FUNCTION_ARG_RECEPIENT_ADDRESS } = process.env;

    const txb = new Transaction();

    // The sender here must be the address of the multisig account
    txb.setSender(MULTISIG_ACCOUNT_ADDRESS);

    // Set the moveCall to the target Move module function
    txb.moveCall({
        target: `${MOVE_PACKAGE_ID}::${MOVE_MODULE}::${MOVE_MODULE_FUNCTION}`,
        arguments: [
            txb.object(MOVE_FUNCTION_ARG_ADMIN_CAP_ID),
            txb.object(MOVE_FUNCTION_ARG_NFT_DATA_ID),
            txb.pure.address(MOVE_FUNCTION_ARG_RECEPIENT_ADDRESS),
            txb.pure.string('some description'),
            txb.pure.string('https://d315pvdvxi2gex.cloudfront.net/d96a337f84c5c900f31e08808.png'),
        ],
    });

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    // Build a transaction block so that it can be signed or simulated
    const txBytes = await txb.build({ client });

    // Convert txb to hex string which can then be used as input to the multisig interface
    const txBytesHexStr = toHEX(txBytes);

    console.log('Build txb result:', txBytesHexStr);
}

main().catch(err => console.error(err));

