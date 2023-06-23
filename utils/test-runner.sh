#!/bin/bash

# Start the blockchain node
./contracts_node/substrate-contracts-node -l error > /dev/null &

# Store the process ID (PID) of the node
NODE_PID=$!

# Run the tests
yarn mocha --config .mocharc.json

# Kill the node after the tests finish
kill $NODE_PID