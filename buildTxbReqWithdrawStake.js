require('dotenv').config({ path: './.env.req.withdraw.stake' });
const { toHEX, IOTA_DECIMALS } = require('@iota/iota-sdk/utils');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const BigNumber = require('bignumber.js');

async function main() {
    const { NETWORK, MULTISIG_ACCOUNT_ADDRESS, UNSTAKED_MIN_AMOUNT, OBJECT_ID_TO_WITHDRAW } = process.env;

    console.log('MULTISIG_ACCOUNT_ADDRESS:', MULTISIG_ACCOUNT_ADDRESS);
    console.log('UNSTAKED_MIN_AMOUNT:', UNSTAKED_MIN_AMOUNT);
    console.log('OBJECT_ID_TO_WITHDRAW:', OBJECT_ID_TO_WITHDRAW);
    console.log('NETWORK:', NETWORK);

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const txb = new Transaction();

    // The sender here must be the address of the multisig account
    txb.setSender(MULTISIG_ACCOUNT_ADDRESS);

    // Find owned objects of the multisig account for the given object type of StakedIota
    let ownedObjectsResp;
    try {
        // Query objects owned by the account address
        ownedObjectsResp = await client.getOwnedObjects({
            owner: MULTISIG_ACCOUNT_ADDRESS,
            filter: {
                MatchAll: [
                    { StructType: "0x3::staking_pool::StakedIota" },
                ],
            },
            options: {
                showContent: true,
                showType: true,
            },
        });
    } catch (error) {
        console.error("Error fetching owned objects:", error);
        return;
    }

    if (!ownedObjectsResp.data || ownedObjectsResp.data.length === 0) {
        console.error("No StakedIota asset available");
        return;
    }

    // From the found objects, find the one with the "principal" amount >= UNSTAKED_MIN_AMOUNT
    let foundObjId = null;
    const unstakedAmount = new BigNumber(UNSTAKED_MIN_AMOUNT).multipliedBy(10 ** IOTA_DECIMALS).toString();
    for (const obj of ownedObjectsResp.data) {
        if (Number(obj.data.content?.fields?.principal) >= Number(unstakedAmount)) {
            foundObjId = obj.data.objectId;

            if (OBJECT_ID_TO_WITHDRAW && OBJECT_ID_TO_WITHDRAW !== foundObjId) {
                // console.warn(`Found object ID ${foundObjId} does not match the specified OBJECT_ID_TO_WITHDRAW ${OBJECT_ID_TO_WITHDRAW}. Continue searching.`);
                continue;
            }
            
            console.log('Found object ID:', foundObjId);
            break;
        }
    }

    if (!foundObjId) {
        console.error("No StakedIota asset with the required UNSTAKED_MIN_AMOUNT available");
        return;
    }

    // Set the moveCall to the target Move module function
    txb.moveCall({
        target: '0x3::iota_system::request_withdraw_stake',
        arguments: [
            txb.object('0x5'), // IotaSystemState obj
            txb.object(foundObjId), // StakedIota obj
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

