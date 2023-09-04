import { expect } from "chai";
import Constructors from "../../typed_contracts/multisig/constructors/multisig";
import Contract from "../../typed_contracts/multisig/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { assignKeyringPairs } from "../utils/testHelpers";

let api;
let keyring;
let keypairs;
let aliceKeyringPair;
let bobKeyringPair;
let charlieKeyringPair;

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

describe("Constructor tests", () => {
  before(() => {
    // call function to create keyring pairs
    keypairs = assignKeyringPairs(keyring, 3);
    [aliceKeyringPair, bobKeyringPair, charlieKeyringPair] = keypairs;
  });

  it("Alice should create a new multisig succesfully with her, Bob and Charlie", async () => {
    // Initial args
    const init_threshold = 2;

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(init_threshold, [
      aliceKeyringPair.address,
      bobKeyringPair.address,
      charlieKeyringPair.address,
    ]);

    // Assert that the contract was created
    expect(address).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    // Assert that the contract has the correct values
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);

    const owners = (await multisig.query.getOwners()).value.unwrap();
    expect(owners).to.have.lengthOf(3);
  });

  it("Alice should create a new multisig succesfully with only Bob and Charlie", async () => {
    // Initial args
    const init_threshold = 2;

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(init_threshold, [
      bobKeyringPair.address,
      charlieKeyringPair.address,
    ]);

    // Assert that the contract was created
    expect(address).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    // Assert that the contract has the correct values
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);

    const owners = (await multisig.query.getOwners()).value.unwrap();
    expect(owners).to.have.lengthOf(2);
    expect(owners).to.include(bobKeyringPair.address);
    expect(owners).to.include(charlieKeyringPair.address);
    expect(owners).to.not.include(aliceKeyringPair.address);
  });

  it("Should error because threshold is greater than owners", async () => {
    // Initial args
    const init_threshold = 3;

    // Try to create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    try {
      await constructors.new(init_threshold, [
        aliceKeyringPair.address,
        bobKeyringPair.address,
      ]);
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should error because threshold is 0", async () => {
    // Initial args
    const init_threshold = 0;

    // Try to create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    try {
      await constructors.new(init_threshold, [
        aliceKeyringPair.address,
        bobKeyringPair.address,
      ]);
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should error because owners cannot be empty", async () => {
    // Initial args
    const init_threshold = 2;

    // Try to create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    try {
      await constructors.new(init_threshold, []);
    } catch (error) {
      expect(error).to.exist;
    }
  });
});
