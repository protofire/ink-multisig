# Create destination folders
mkdir -p $(pwd)/artifacts/multisig $(pwd)/artifacts/multisig-factory
mkdir -p $(pwd)/typed_contracts/multisig $(pwd)/typed_contracts/multisig-factory

# Copy artifacts
cp $(pwd)/contracts/multisig/target/ink/multisig.contract $(pwd)/artifacts/multisig/multisig.contract && cp $(pwd)/contracts/multisig/target/ink/multisig.json $(pwd)/artifacts/multisig/multisig.json
cp $(pwd)/contracts/multisig-factory/target/ink/multisig_factory.contract $(pwd)/artifacts/multisig-factory/multisig_factory.contract && cp $(pwd)/contracts/multisig-factory/target/ink/multisig_factory.json $(pwd)/artifacts/multisig-factory/multisig_factory.json

# Create typechain bindings
npx @727-ventures/typechain-polkadot --input artifacts/multisig --output typed_contracts/multisig
npx @727-ventures/typechain-polkadot --input artifacts/multisig-factory --output typed_contracts/multisig-factory