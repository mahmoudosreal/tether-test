# P2P Auction Solution

## Overview
This project demonstrates a basic peer-to-peer (P2P) solution for handling auctions. Due to time constraints and challenges faced while working with `hypercore`, I opted for a simpler approach. My aim was to create a functional concept based on a P2P network where nodes communicate with each other directly without a centralized database. The solution includes a server to handle node connections, inform nodes about each other’s public keys, and remove inactive nodes.

While this implementation is basic, it can be enhanced in the future to incorporate a more robust architecture using `hypercore` and `hyperbee`.

## Approach
- **Challenges**: During my initial work, I tried using `hypercore`, but I encountered issues due to time limitations and lack of resources during my travel. Instead, I focused on developing a simpler, working concept.
- **Current Implementation**: The solution revolves around a server that manages connected nodes. It informs all nodes of the public keys of the other nodes. Nodes that do not perform any actions within 30 seconds are removed from the network. Once the nodes are aware of each other, they can communicate and process requests via an RPC server created in each node, representing a basic P2P concept.

## Future Enhancements
1. **Integrate Hypercore and Hyperbee**: Use `hyperbee` and `hypercore` to store auction data and manage node connections in real-time. This would create a more decentralized, resilient solution.
2. **Error Handling**: Improve error handling, e.g., allowing only one open auction per user, validating bids, etc.
3. **Clean Code**: Refactor the codebase to have a cleaner structure and more modular organization.

## How to Use
1. **Run the Server**:
   ```bash
   node server.js
   ```
2. **Get Server Key**: Retrieve the server's public key and copy it to `client.js`.
3. **Run Clients**:
   ```bash
   node client.js
   ```
   Multiple clients can be run to simulate multiple nodes in the network.

4. **Available Commands**:
   - `openAuction <itemID> <firstPrice>`: Open an auction for an item with an initial price.
   - `makeBid <itemID> <bidPrice>`: Place a bid on an auction.
   - `closeAuction <itemID>`: Close an auction.

## ScreenShots
1. **Run HyperDHT**:
![Run HyperDHT.](https://firebasestorage.googleapis.com/v0/b/mahmoudosplatform.appspot.com/o/tether-test%2FScreenshot%202024-10-04%20at%205.35.38%E2%80%AFPM.png?alt=media&token=af611e0a-096b-4287-9402-84eb428299c3)
2. **Run Server.js and many Client.js**:
![Run Server.js and many Client.js.](https://firebasestorage.googleapis.com/v0/b/mahmoudosplatform.appspot.com/o/tether-test%2FScreenshot%202024-10-04%20at%205.36.23%E2%80%AFPM.png?alt=media&token=c7cb2063-8535-4ef1-8262-2b4316f184ce)

3. **Client 1 Open Auction**:
![.Client 1 Open Auction](https://firebasestorage.googleapis.com/v0/b/mahmoudosplatform.appspot.com/o/tether-test%2FScreenshot%202024-10-04%20at%205.37.21%E2%80%AFPM.png?alt=media&token=fbec7573-d705-4446-9ba6-52facac82810)

4. **Client 2 Make a Bid**:
![Client 2 Make a Bid.](https://firebasestorage.googleapis.com/v0/b/mahmoudosplatform.appspot.com/o/tether-test%2FScreenshot%202024-10-04%20at%205.38.25%E2%80%AFPM.png?alt=media&token=d2382587-2807-4572-9880-adfeba1abc2e)
