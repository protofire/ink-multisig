import { expect } from "chai";
import FactoryConstructors from "../../typed_contracts/multisig-factory/constructors/multisig_factory";
import FactoryContract from "../../typed_contracts/multisig-factory/contracts/multisig_factory";
import MultisigContract from "../../typed_contracts/multisig/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { ContractFile } from "../../typed_contracts/multisig/contract-info/multisig";
import { generateHash } from "../utils/convertions";
import { assignKeyringPairs } from "../utils/testHelpers";

let api;
let keyring;
let factoryContract;
let factoryContract2;
let aliceKeyringPair;

async function setUpFactory(api, keyring) {
  let contract = JSON.parse(ContractFile);
  let wasm = contract.source.wasm;
  let codeHash = contract.source.hash;
  const aliceKeyringPair = assignKeyringPairs(keyring, 1)[0];

  // Upload the contract code first before deploying the factory
  const codeUploadTx = api.tx.contracts.uploadCode(wasm, null, true);
  await codeUploadTx.signAndSend(aliceKeyringPair);

  // Deploy the factory contract
  const factoryConstructors = new FactoryConstructors(api, aliceKeyringPair);
  const { address: factoryAddress } = await factoryConstructors.new(codeHash);

  // Bind the contract to the new address
  factoryContract = new FactoryContract(factoryAddress, aliceKeyringPair, api);

  // Deploy another factory contract with a inexisting codehash
  const inexistingCodeHash = new Array(32).fill(0);
  const { address: factoryAddress2 } = await factoryConstructors.new(
    inexistingCodeHash
  );

  factoryContract2 = new FactoryContract(
    factoryAddress2,
    aliceKeyringPair,
    api
  );
}

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

    // Set up the factory contract
    await setUpFactory(api, keyring);
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
  before(() => {
    const keypairs = assignKeyringPairs(keyring, 1);
    [aliceKeyringPair] = keypairs;
  });

  it("Should create a new multisig succesfully", async () => {
    //Listen for the event
    let newMultisigEvent;
    factoryContract.events.subscribeOnNewMultisigEvent((event) => {
      newMultisigEvent = event;
    });

    // Deploy a new multisig contract from the factory
    const salt = generateHash(Date.now().toString());
    await factoryContract.tx.newMultisig(1, [aliceKeyringPair.address], salt);

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

  it("Should fail to create a new multisig because owners cant be empty", async () => {
    // Try Deploy a new multisig contract from the factory
    const salt = generateHash(Date.now().toString());
    let result = await factoryContract.query.newMultisig(2, [], salt);

    // Check the error message
    expect(result.value.ok?.err).to.have.nested.property(
      "ownersCantBeEmpty",
      null
    );
  });

  it("Should fail to create a new multisig because threshold greater than owners", async () => {
    // Try Deploy a new multisig contract from the factory
    const salt = generateHash(Date.now().toString());
    let result = await factoryContract.query.newMultisig(
      2,
      [aliceKeyringPair.address],
      salt
    );

    // Check the error message
    expect(result.value.ok?.err).to.have.nested.property(
      "thresholdGreaterThanOwners",
      null
    );
  });

  it("Should fail to create a new multisig because threshold is 0", async () => {
    // Try Deploy a new multisig contract from the factory
    const salt = generateHash(Date.now().toString());
    let result = await factoryContract.query.newMultisig(
      0,
      [aliceKeyringPair.address],
      salt
    );

    // Check the error message
    expect(result.value.ok?.err).to.have.nested.property(
      "thresholdCantBeZero",
      null
    );
  });

  it("Should fail to create a new multisig because wrong codehash", async () => {
    // Try Deploy a new multisig contract from the factory with a wrong codehash
    const salt = generateHash(Date.now().toString());
    let result = await factoryContract2.query.newMultisig(
      1,
      [aliceKeyringPair.address],
      salt
    );

    // Check the error message
    expect(result.value.ok?.err).to.have.nested.property(
      "envExecutionFailed",
      "CodeNotFound"
    );
  });
});
