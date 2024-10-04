'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')

const main = async () => {
    // hyperbee db
    const hcore = new Hypercore('./db/rpc-server')
    const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
    await hbee.ready()

    // resolved distributed hash table seed for key pair
    let dhtSeed = (await hbee.get('dht-seed'))?.value
    if (!dhtSeed) {
        // not found, generate and store in db
        dhtSeed = crypto.randomBytes(32)
        await hbee.put('dht-seed', dhtSeed)
    }

    // start distributed hash table, it is used for rpc service discovery
    const dht = new DHT({
        port: 40001,
        keyPair: DHT.keyPair(dhtSeed),
        bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note boostrap points to dht that is started via cli
    })

    // resolve rpc server seed for key pair
    let rpcSeed = (await hbee.get('rpc-seed'))?.value
    if (!rpcSeed) {
        rpcSeed = crypto.randomBytes(32)
        await hbee.put('rpc-seed', rpcSeed)
    }

    // setup rpc server
    const rpc = new RPC({ seed: rpcSeed, dht })
    const rpcServer = rpc.createServer()
    await rpcServer.listen()
    console.log('rpc server started listening on public key:', rpcServer.publicKey.toString('hex'))

    let connections = [];

    setInterval(() => {
        var timestampTrigger = Date.now() - 30000;
        connections.forEach((conn) => {
            if (timestampTrigger > conn.timestamp) {
                const index = connections.indexOf(conn);
                if (index > -1) {
                    connections.splice(index, 1);
                    console.log('removed: ', conn.user);
                }
            }
        })
    }, 30000)

    // bind handlers to rpc server
    rpcServer.respond('ping', async (reqRaw) => {
        // reqRaw is Buffer, we need to parse it
        const req = JSON.parse(reqRaw.toString('utf-8'))
        let isFound = false;
        connections.forEach((conn) => {
            // console.log(conn)
            if (conn.user == req.user) {
                isFound = true
            }
        })
        let message = "connection added";
        if(isFound == false){
            connections.push(req)
        }
        else {
            message = "connection already exist";
        }
        // console.log(message)
        const resp = { nonce: req.nonce + 1, message : message }
        // we also need to return buffer response
        const respRaw = Buffer.from(JSON.stringify(resp), 'utf-8')
        return respRaw
    })

    rpcServer.respond('who-is-in', async (reqRaw) => {
        // console.log(connections);
        const resp = { connections: connections }
        const respRaw = Buffer.from(JSON.stringify(resp), 'utf-8')
        return respRaw
    })
}

main().catch(console.error)