const readlineSync = require('readline-sync');
const request = require("sync-request");
const lisk = require('lisk-elements');

const MS_ENDPOINTS = [
    "/api/node/transactions/pending",
    "/api/node/transactions/validated",
    // "/api/node/transactions/verified",
    // "/api/node/transactions/ready",
    // "/api/node/transactions/received",
]

const NODES = [
    "https://wallet.mylisk.com",
    "https://www.hmachadowallet.com",
    "https://lisk-api.punkrock.me",
    "https://lisk-login.vipertkd.com",
    "https://wallet.lisknode.io",
    "https://lisknode.grumlin.com",
    "https://liskworld.info"
];

// **** TESTNET OR MAINNET ****
const NETWORK = 'mainnet';

const NETHASH = NETWORK == 'mainnet' ?
    "ed14889723f24ecc54871d058d98ce91ff2f973192075c0155ba2b7b70ad2511" // mainnet
    : "da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba"; // testnet

const HEADERS = {
    'Content-type': 'application/json',
    'version': '0.9.15',
    'port': '1',
    'nethash': NETHASH
};

// **** PUT HERE THE PUBKEY OF THE MULTISIGNATURE ADDRESS ****
//var pubkey = "15b50402822a1ecc3d8f17ccae407858078a21ca940cfa919ec42ed50c4e612f"; // my own 1
//var pubkey = "c56ff6d8c3a4e826c2136e50a4ff1c0f51cc85ec7b05b8c1810c4070cce17a47"; // my own 2
//var pubkey = "5fdd42a495e6798e7e8524da4c0fdeb290456d3fc25d602e969db6c48dda17ac"; // fulig
const pubkey = "380b952cd92f11257b71cce73f51df5e0a258e54f60bb82bccd2ba8b4dff2ec9" // gdtpool


// **** URL FOR TESTNET OR MAINNET ****
let node = readlineSync.question('Type a number from 1 to 7 to choose a node and press enter (default 1) : ', {
    hideEchoBack: false
});

const url = (node > 0 && node < 8) ? NODES[node - 1] : url = NODES[0];

function getPendingMultisignature(endpoint) {
    res = request('GET', `${url}${endpoint}?offset=0&limit=100`);
    data = JSON.parse(res.getBody('utf8'));

    if (data.meta.count <= 100)
        return data.data;

    let pending = data.data;

    for (let m = 100; m < (data.meta.count); m += 100) {
        res = request('GET', `${url}${endpoint}?offset=${m}&limit=100`);
        data = JSON.parse(res.getBody('utf8'));

        pending = pending.concat(data.data);
    }

    return pending;
}

let pending = [];

for (let e of MS_ENDPOINTS) 
    pending = pending.concat(getPendingMultisignature(e));

if (pending.length == 0) {
    console.log("No tx to sign, belonging to the given pubkey - exiting")
    process.exit(0);
}

console.log(pending.length + " tx to be signed, belonging to the given pubkey ");
const seed = readlineSync.question('What is your seed? ', { hideEchoBack: true });


for (let i = 0; i < pending.length; i++) {
    const userStr = JSON.stringify(pending[i]);

    if (!(userStr).includes(pubkey))
        continue;

    const transaction = lisk.transaction.createSignatureObject((pending[i]), seed);
    // const data = JSON.stringify(transaction);
    // const json_obj = JSON.parse(data);
    const id = pending[i].id;
    const res = request('POST', `${url}/api/signatures/`, { json: transaction, headers: HEADERS });

    try {
        const reply = JSON.stringify(res.getBody('utf8'));

        if (reply.includes("true"))
            console.log(id + " Signed");
        else if (reply.includes("transaction not found"))
            console.log(id + " Transaction not found");
        else if (reply.includes("already present in transaction"))
            console.log(id + " Signature already exists");
        else if (reply.includes("is not a member for account")) 
            console.log(id + " Failed to verify signature");
    } catch (err) {
        if (res.statusCode == 200)
            console.log(id + " Signed");
        else if (res.statusCode == 409) 
            console.log(id + " Failed");
    }
}