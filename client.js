'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')
const readline = require("readline");

// Set up command-line input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const main = async () => {

    // Check the command and arguments from terminal
    function handleCommand(command, args) {
        switch (command) {
            case 'openAuction':
                if (args.length >= 2) {
                    openAuction(args[0], args[1]);
                } else {
                    console.log('Usage: openAuction <itemID> <firstPrice>');
                }
                break;

            case 'makeBid':
                if (args.length >= 2) {
                    makeBid(args[0], args[1]);
                } else {
                    console.log('Usage: makeBid <itemID> <bidPrice>');
                }
                break;

            case 'closeAuction':
                if (args.length >= 1) {
                    closeAuction(args[0]);
                } else {
                    console.log('Usage: closeAuction <itemID>');
                }
                break;

            default:
                console.log('Unknown command. Please use one of the following: openAuction, makeBid, closeAuction.');
        }
    }

    let dhtSeed = crypto.randomBytes(32)
    console.log(dhtSeed)

    // start distributed hash table, it is used for rpc service discovery
    const dht = new DHT({
        port: 50001,
        keyPair: DHT.keyPair(dhtSeed),
        bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note boostrap points to dht that is started via cli
    })

    // public key of rpc server, used instead of address, the address is discovered via dht
    const serverPubKey = Buffer.from('64c63559e40cf8670526435f94b3df31336000bea0818659877ee58fbe2de001', 'hex')

    // rpc lib
    const rpc = new RPC({ dht })

    const rpcClient = rpc.createServer()
    await rpcClient.listen()

    let myToken = rpc.defaultKeyPair.publicKey.toString('hex')

    console.log(myToken)

    // Prompt the user to choose an action
    console.log('Node is connected. Which action would you like to perform?');
    console.log('Use one of the following commands:');
    console.log('1. openAuction <itemID> <firstPrice>');
    console.log('2. makeBid <itemID> <bidPrice>');
    console.log('3. closeAuction <itemID>');

    // Capture user input for the function call
    rl.question('Enter command: ', (input) => {
        const [command, ...args] = input.split(' ');
        handleCommand(command, args);
        rl.close();
    });

    // connect to server
    const payload = { nonce: 126, user: myToken, timestamp: Date.now() }
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
    let respRaw
    setInterval(async () => {
        respRaw = await rpc.request(serverPubKey, 'ping', payloadRaw)
        const resp = JSON.parse(respRaw.toString('utf-8'))
        // console.log(resp)
    }, 5000)

    // check who is in
    let connections = [];

    let auctions = [];

    // auction: { ownerID: itemID: currentPrice: winnderID: def(zero) status: [open], [closed] }

    setInterval(async () => {
        // console.log("Who Is In");
        const who_is_in_Raw = await rpc.request(serverPubKey, 'who-is-in', payloadRaw)
        const who_is_in = JSON.parse(who_is_in_Raw.toString('utf-8'))
        connections = who_is_in.connections;
        // console.log(connections)
    }, 10000)


    function openAuction(itemIDParam, priceParam) {
        if (auctions.length > 0) {
            let notFound = true;
            auctions.forEach((auction) => {
                if (auction.itemID == itemIDParam) {
                    notFound = false;
                }
            })
            if(notFound) {
                // auction: { ownerID: itemID: currentPrice: winnderID: def(zero) status: [open], [closed] }
                openAnAuction(itemIDParam, priceParam);
                auctions.push({ownerID: myToken, itemID: itemIDParam, currentPrice: priceParam, winnderID: '_', status: 'open'})
            }
        }
        else {
            openAnAuction(itemIDParam, priceParam);
            auctions.push({ownerID: myToken, itemID: itemIDParam, currentPrice: priceParam, winnderID: '_', status: 'open'})
        }
    }

    function makeBid(itemIDParam, priceParam) {
        console.log("make bid")
        if (auctions.length > 0) {
            auctions.forEach((auction) => {
                if (auction.itemID == itemIDParam) {
                    makeABid(itemIDParam, priceParam);
                    auction.winnderID = myToken;
                    auction.currentPrice = priceParam;
                }
                else {
                    console.log("no item found");
                }
            })
        }
        console.log(auctions);
    }

    function closeAuction(itemIDParam) {
        console.log("close auction")
        if (auctions.length > 0) {
            auctions.forEach((auction) => {
                if (auction.itemID == itemIDParam && myToken == auction.ownerID) {
                    closeAnAuction(itemIDParam);
                    auction.status = "closed";
                }
                else {
                    console.log("no item found");
                }
            })
        }
        console.log(auctions);
    }

    // Request Open Auction 
    function openAnAuction(itemIDParam, priceParam) {
        console.log("openAnAuction: ", connections.length);
        if (connections.length >= 2) {
            connections.forEach((conn) => {
                let userUID = conn.user;
                console.log("userUID: ", userUID);
                if (userUID != myToken) {
                    const clientKey = Buffer.from(userUID, 'hex')
                    const payloadOpenAnAuction = { client: myToken, itemID: itemIDParam, price : priceParam }
                    const payloadRawOpenAnAuction = Buffer.from(JSON.stringify(payloadOpenAnAuction), 'utf-8')
                    rpc.request(clientKey, 'open-an-auction', payloadRawOpenAnAuction)
                    console.log(auctions);
                }
            })
        }
    }

    // Request Open Auction 
    function makeABid(itemIDParam, priceParam) {
        console.log("makeABid: ", connections.length);
        if (connections.length >= 2) {
            connections.forEach((conn) => {
                let userUID = conn.user;
                console.log("userUID: ", userUID);
                if (userUID != myToken) {
                    const clientKey = Buffer.from(userUID, 'hex')
                    const payloadMakeABid = { client: myToken, itemID: itemIDParam, price : priceParam }
                    const payloadRawMakeABid = Buffer.from(JSON.stringify(payloadMakeABid), 'utf-8')
                    rpc.request(clientKey, 'make-a-bid', payloadRawMakeABid)
                    console.log(auctions);
                }
            })
        }
    }

    // Request Open Auction 
    function closeAnAuction(itemIDParam) {
        console.log("closeAuction: ", connections.length);
        if (connections.length >= 2) {
            connections.forEach((conn) => {
                let userUID = conn.user;
                console.log("userUID: ", userUID);
                if ((userUID != myToken) && (myToken == userUID)) {
                    const clientKey = Buffer.from(userUID, 'hex')
                    const payloadCloseAuction = { client: myToken, itemID: itemIDParam }
                    const payloadRawCloseAuction = Buffer.from(JSON.stringify(payloadCloseAuction), 'utf-8')
                    rpc.request(clientKey, 'close-auction', payloadRawCloseAuction)
                    console.log(auctions);
                }
            })
        }
    }

    // Handle When Other Open An Auction
    rpcClient.respond('open-an-auction', async (reqRaw) => {
        const req = JSON.parse(reqRaw.toString('utf-8'))
        console.log("auction alert: Open");
        console.log(req)
        if (auctions.length > 0) {
            let notFound = true;
            auctions.forEach((auction) => {
                if (auction.itemID == req.itemID) {
                    notFound = false;
                }
            })
            if(notFound) {
                // auction: { ownerID: itemID: currentPrice: winnderID: def(zero) status: [open], [closed] }
                auctions.push({ownerID: req.client, itemID: req.itemID, currentPrice: req.price, winnderID: '_', status: 'open'})
            }
        }
        else {
            auctions.push({ownerID: req.client, itemID: req.itemID, currentPrice: req.price, winnderID: '_', status: 'open'})
        }
        console.log(auctions);
    })

    // Handle When Other Make a bid
    rpcClient.respond('make-a-bid', async (reqRaw) => {
        const req = JSON.parse(reqRaw.toString('utf-8'))
        console.log("auction alert: Bid");
        console.log(req)
        if (auctions.length > 0) {
            auctions.forEach((auction) => {
                if (auction.itemID == req.itemID) {
                    auction.currentPrice = req.price;
                    auction.winnderID = req.client;
                }
            })
        }
        console.log(auctions);
    })

    // Handle When Other Close Auction
    rpcClient.respond('close-auction', async (reqRaw) => {
        const req = JSON.parse(reqRaw.toString('utf-8'))
        console.log("auction alert: Close");
        console.log(req)
        if (auctions.length > 0) {
            auctions.forEach((auction) => {
                if (auction.itemID == req.itemID) {
                    auction.status = "closed";
                }
            })
        }
        console.log(auctions);
    })


}

main().catch(console.error)
