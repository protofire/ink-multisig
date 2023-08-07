import { expect } from "chai";
import FactoryConstructors from "../typed_contracts/multisig-factory/constructors/multisig_factory";
import FactoryContract from "../typed_contracts/multisig-factory/contracts/multisig_factory";
import MultisigContract from "../typed_contracts/multisig/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { ContractFile } from "../typed_contracts/multisig/contract-info/multisig";
import { generateHash } from "./utils/convertions";

let api;
let keyring;

before(async () => {
  try {
    // Perform async operations to obtain the api instance
    const wsProvider = new WsProvider("ws://127.0.0.1:9944");

    api = await ApiPromise.create({ provider: wsProvider });

    if (!wsProvider.isConnected) {
      throw new Error("Unable to connect to WebSocket");
    }

    // Create a keyring instance
    keyring = new Keyring({ type: "sr25519" });
  } catch (error) {
    console.error(error);
    process.exit(1); // Terminate the execution
  }
});

after(() => {
  // Disconnect from the API on completion
  api.disconnect();
});

describe("Multisig Factory", () => {
  it("Should create a new multisig using the factory contract", async () => {
    // Obtain the necessary data to deploy the contract
    let contract = JSON.parse(ContractFile);
    let wasm = contract.source.wasm;
    let codeHash = contract.source.hash;
    const aliceKeyringPair = keyring.addFromUri("//Alice");

    // Upload the contract code first before deploying the factory
    const codeUploadTx = api.tx.contracts.uploadCode(wasm, null, true);
    await codeUploadTx.signAndSend(aliceKeyringPair);

    // Check that the contract code is on chain
    const wasmOnChain = await api.query.contracts.pristineCode(codeHash);
    expect(wasmOnChain).to.exist;
    expect(wasmOnChain.toHuman()).to.equal(wasm);

    // Deploy the factory contract
    const factoryConstructors = new FactoryConstructors(api, aliceKeyringPair);
    const { address: factoryAddress } = await factoryConstructors.new(codeHash);
    expect(factoryAddress).to.exist;

    // Bind the contract to the new address
    const factoryContract = new FactoryContract(
      factoryAddress,
      aliceKeyringPair,
      api
    );

    //Listen for the event
    let newMultisigEvent;
    factoryContract.events.subscribeOnNewMultisigEvent((event) => {
      newMultisigEvent = event;
    });

    // Deploy a new multisig contract from the factory
    const salt = generateHash(Date.now().toString());
    await factoryContract.tx.newMultisig(
      1,
      [aliceKeyringPair.address],
      salt
    );

    // Check that the new multisig contract was deployed correctly
    expect(newMultisigEvent.threshold).to.equal(1);
    expect(newMultisigEvent.ownersList[0]).to.equal(aliceKeyringPair.address);

    // Bind the new multisig contract to the new address
    const multisigContract = new MultisigContract(
      newMultisigEvent.multisigAddress,
      aliceKeyringPair,
      api
    );

    // Check that the multisig contract data is correct
    const multisigThreshold = (
      await multisigContract.query.getThreshold()
    ).value.unwrap();
    expect(multisigThreshold).to.equal(1);

    const multisigOwners = (
      await multisigContract.query.getOwners()
    ).value.unwrap();
    expect(multisigOwners[0]).to.equal(aliceKeyringPair.address);
  });
});
