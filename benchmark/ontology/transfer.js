'use strict';

module.exports.info = 'sendTx ont';
const Util = require('../../src/comm/util.js');
const log = Util.log;
const ontSdk = require('ontology-ts-sdk');

let txNum, txIndex;
let bc;
let txHash = [], txData = [];
let sendTx = true; // false means that client monitor only


// read tx from file, or use sdk to generate tx
module.exports.init = async function (blockchain, context, args) {
    if (!args.hasOwnProperty('sendTx')) {
        return Promise.reject(new Error('sendTx init - "sendTx" is missed in the arguments'));
    }
    sendTx = args.sendTx;
    bc = blockchain;
    if (sendTx) {
        await bc.bcObj.initOnt(bc.bcObj.account.address);
        await bc.bcObj.withdrawOng(bc.bcObj.account.address);
    }
    txNum = args.txNum;
    if (sendTx && !args.hasOwnProperty('sendToAddress')) {
        return Promise.reject(new Error('sendTx init - "sendToAddress" is missed in the arguments'));
    }
    for (let i = 0; i < txNum; i++) {
        let tx = ontSdk.OntAssetTxBuilder.makeTransferTx('ONG', bc.bcObj.account.address,
            new ontSdk.Crypto.Address(args.sendToAddress), 0.001 * 1e9, '0', '20000', bc.bcObj.account.address);
        ontSdk.TransactionBuilder.signTransaction(tx, bc.bcObj.privateKey);
        txHash.push(ontSdk.utils.reverseHex(tx.getHash()));
        txData.push(tx.serialize());
    }
    return Promise.resolve();
};


// should sendTx one time in one invoke
module.exports.run = function () {
    txIndex++;
    if (txIndex >= txNum) {
        txIndex = 0;
        log('there are no new tx, send duplicate tx to ontology!');
    }
    if (sendTx) {
        return bc.sendTx(txData[txIndex], txHash[txIndex]);
    } else {
        return bc.sendNon(txHash[txIndex]);
    }
};

module.exports.end = function () {
    txHash = [];
    txData = [];
    return Promise.resolve();
};
