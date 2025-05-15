require('dotenv').config({ path: './.env.transfer.object' });
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');

async function main() {
    const { NETWORK, OBJECT_ID, NEW_OWNER_ACCOUNT_ADDRESS, CURRENT_OWNER_ACCOUNT_MNEMONIC } = process.env;

    const keypair = Ed25519Keypair.deriveKeypair((CURRENT_OWNER_ACCOUNT_MNEMONIC));

    const txb = new Transaction();
    const senderAddress = keypair.toIotaAddress();
    console.log('Sender address:', senderAddress);
    txb.setSender(senderAddress);

    console.log('OBJECT_ID:', OBJECT_ID);
    console.log('NEW_OWNER_ACCOUNT_ADDRESS:', NEW_OWNER_ACCOUNT_ADDRESS);
    console.log('NETWORK:', NETWORK);

    txb.transferObjects(
        [txb.object(OBJECT_ID)], // object(s) to transfer
        txb.pure.address(NEW_OWNER_ACCOUNT_ADDRESS)     // recipient address
    );

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
    });

    console.log('Result:', result);
}

main().catch(err => console.error(err));

