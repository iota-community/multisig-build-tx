require('dotenv').config();
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');
const { fromB64 } = require('@iota/bcs');

async function main() {
    const { OBJECT_ID, NEW_OWNER_ACCOUNT_ADDRESS, CURRENT_OWNER_ACCOUNT_PRIV_KEY, CURRENT_OWNER_ACCOUNT_MNEMONIC } = process.env;

    let keypair;
    if (CURRENT_OWNER_ACCOUNT_MNEMONIC) {
        keypair = Ed25519Keypair.deriveKeypair((CURRENT_OWNER_ACCOUNT_MNEMONIC));
    } else if (CURRENT_OWNER_ACCOUNT_PRIV_KEY) {
        keypair = Ed25519Keypair.deriveKeypairFromSeed((CURRENT_OWNER_ACCOUNT_PRIV_KEY));
    } else {
        throw new Error('Neither CURRENT_OWNER_ACCOUNT_MNEMONIC nor CURRENT_OWNER_ACCOUNT_PRIV_KEY not set');
    }

    const txb = new Transaction();
    txb.setSender(keypair.toIotaAddress());

    txb.transferObjects(
        [txb.object(OBJECT_ID)], // object(s) to transfer
        txb.pure.address(NEW_OWNER_ACCOUNT_ADDRESS)     // recipient address
    );

    const client = new IotaClient({ url: getFullnodeUrl('testnet') });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
    });

    console.log('Result:', result);
}

main().catch(err => console.error(err));

