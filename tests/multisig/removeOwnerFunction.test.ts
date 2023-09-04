import { expect } from "chai";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import ContractAbi from "../../artifacts/multisig/multisig.json";
import { MessageIndex } from "../utils/MessageIndex";
import {
  assignKeyringPairs,
  createABCMultiSigAndEnsureState,
  buildTransaction,
  proposeTransaction,
} from "../utils/testHelpers";
import Contract from "../../typed_contracts/multisig/contracts/multisig";
import Constructors from "../../typed_contracts/multisig/constructors/multisig";

let api;
let keyring;
let aliceKeyringPair;
let bobKeyringPair;
let charlieKeyringPair;
let daveKeyringPair;
let keypairs;
let multisigMessageIndex;

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

describe("Remove Owner Function", () => {
  before(() => {
    // call function to create keyring pairs
    keypairs = assignKeyringPairs(keyring, 4);
    [aliceKeyringPair, bobKeyringPair, charlieKeyringPair, daveKeyringPair] =
      keypairs;
    // Index that allows to get the selector of a message by its label
    multisigMessageIndex = new MessageIndex(ContractAbi);
  });

  it("Should remove an existing owner", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const rmOwnerTx = await buildTransaction(
      api,
      address,
      "remove_owner",
      [charlieKeyringPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, rmOwnerTx);

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the success in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("success");

    // Check the state after the execution of the transaction
    // Because the threshold is 2, the transaction is executed automatically and removed
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // charlie is removed as an owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(2);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
  });

  it("Should not remove a non existing owner", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const rmOwnerTx = await buildTransaction(
      api,
      address,
      "remove_owner",
      [daveKeyringPair.address],
      multisigMessageIndex
    );

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Propose the transaction on chain
    await proposeTransaction(multisig, rmOwnerTx);

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the fail in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");

    // Check the state after the execution of the transaction
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // no one is removed as an owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(3);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
    expect(newOwners).to.include(charlieKeyringPair.address);
  });

  it("Should not remove an only owner", async () => {
    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(1, [aliceKeyringPair.address]);

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    const rmOwnerTx = await buildTransaction(
      api,
      address,
      "remove_owner",
      [aliceKeyringPair.address],
      multisigMessageIndex
    );

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Propose the transaction on chain
    await multisig.tx.proposeTx(rmOwnerTx);

    // Check the state after the proposeTx call
    let tx = await multisig.query.getTx(0);
    expect(tx).to.exist;

    // Emit the fail in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");

    // Check the state after the execution of the transaction
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // no one is removed as an owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(1);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.not.include(bobKeyringPair.address);
    expect(newOwners).to.not.include(charlieKeyringPair.address);
  });

  it("Should not remove an owner if the threshold does not makes sense after removing", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs,
      3
    );

    const rmOwnerTx = await buildTransaction(
      api,
      address,
      "remove_owner",
      [aliceKeyringPair.address],
      multisigMessageIndex
    );

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Propose the transaction on chain
    await proposeTransaction(multisig, rmOwnerTx);

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);
    // Approve the transaction by Charlie
    await multisig.withSigner(charlieKeyringPair).tx.approveTx(0);

    // Emit the fail in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");

    // Check the state after the execution of the transaction
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // no one is removed as an owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(3);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
    expect(newOwners).to.include(charlieKeyringPair.address);
  });
});
