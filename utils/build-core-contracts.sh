#!/bin/bash

# Check if the "--release" flag was provided as an argument
if [[ "$1" == "--release" ]]; then
  RELEASE_FLAG="--release"
else
  RELEASE_FLAG=""
fi

# Compile multisig and multisig factory contracts
docker run -v "$(pwd)/contracts:/contracts" ink-rust-env /bin/bash -c  "cd multisig \
    && cargo contract build $RELEASE_FLAG \
    && cd ../multisig-factory \
    && cargo contract build $RELEASE_FLAG \
"