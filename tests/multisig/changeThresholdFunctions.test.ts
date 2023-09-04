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

describe("Change Threshold Function", () => {
  before(() => {
    // call function to create keyring pairs
    keypairs = assignKeyringPairs(keyring, 4);
    [aliceKeyringPair, bobKeyringPair, charlieKeyringPair] = keypairs;
    // Index that allows to get the selector of a message by its label
    multisigMessageIndex = new MessageIndex(ContractAbi);
  });

  it("Should change the threshold", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const changeThresholdTx = await buildTransaction(
      api,
      address,
      "change_threshold",
      [1],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, changeThresholdTx);

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

    // threshold has changed
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(1);
  });

  it("Should not change the threshold if it's greater than owners list len", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const changeThresholdTx = await buildTransaction(
      api,
      address,
      "change_threshold",
      [4],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, changeThresholdTx);

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the success in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");

    // Check the state after the execution of the transaction
    // Because the threshold is 2, the transaction is executed automatically and removed
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // threshold is still 2
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);
  });

  it("Should not change the threshold to zero", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const changeThresholdTx = await buildTransaction(
      api,
      address,
      "change_threshold",
      [0],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, changeThresholdTx);

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the success in the event result
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");

    // Check the state after the execution of the transaction
    // Because the threshold is 2, the transaction is executed automatically and removed
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // threshold is still 2
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);
  });
});
