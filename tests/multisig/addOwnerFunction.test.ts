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

describe("Add Owner Function", () => {
  before(() => {
    // call function to create keyring pairs
    keypairs = assignKeyringPairs(keyring, 4);
    [aliceKeyringPair, bobKeyringPair, charlieKeyringPair, daveKeyringPair] =
      keypairs;
    // Index that allows to get the selector of a message by its label
    multisigMessageIndex = new MessageIndex(ContractAbi);
  });

  it("Should add a new owner", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const addOwnerTx = await buildTransaction(
      api,
      address,
      "add_owner",
      [daveKeyringPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

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

    // Dave is added as a new owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(4);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
    expect(newOwners).to.include(charlieKeyringPair.address);
    expect(newOwners).to.include(daveKeyringPair.address);
  });

  it("Should not add a repeated owner", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const addOwnerTx = buildTransaction(
      api,
      address,
      "add_owner",
      [bobKeyringPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the error in the event
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");
    expect(Object.keys(newTxExecutedEvent.result.failed)).to.include(
      "envExecutionFailed"
    );

    // Check the state after the execution of the transaction
    // Because the threshold is 2, the transaction is executed automatically and removed
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // Dave is added as a new owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(3);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
    expect(newOwners).to.include(charlieKeyringPair.address);
  });

  it("Should not add a new owner when rejections make the aproval imposible to met", async () => {
    // Create a new contract
    const [address, multisig] = await createABCMultiSigAndEnsureState(
      api,
      keypairs
    );

    const addOwnerTx = buildTransaction(
      api,
      address,
      "add_owner",
      [daveKeyringPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

    // Reject the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.rejectTx(0);

    // The proposed transaction has 1 approval and 1 rejections
    const approvals = (await multisig.query.getTxApprovals(0)).value.ok;
    expect(approvals).to.equal(1);

    const rejections = (await multisig.query.getTxRejections(0)).value.ok;
    expect(rejections).to.equal(1);

    // Reject the transaction by Charlie
    await multisig.withSigner(charlieKeyringPair).tx.rejectTx(0);

    // Because the threshold is 2, the transaction will never be able to achieve the threshold
    // so it is not executed and automatically removed
    const tx_0 = (await multisig.query.getTx(0)).value.ok;
    expect(tx_0).to.not.exist;

    // Dave is not added as a new owner
    const newOwners = (await multisig.query.getOwners()).value.unwrap();
    expect(newOwners).to.have.lengthOf(3);
    expect(newOwners).to.include(aliceKeyringPair.address);
    expect(newOwners).to.include(bobKeyringPair.address);
    expect(newOwners).to.include(charlieKeyringPair.address);
    expect(newOwners).to.not.include(daveKeyringPair.address);
  });

  it("Should not add a new owner when MAX_OWNERS is reached", async () => {
    let keypairs = assignKeyringPairs(keyring, 10);
    let zetaKeyPair = keyring.addFromUri("//Zeta");

    // Create a new contract
    const constructors = new Constructors(api, keypairs[0]);

    const { address } = await constructors.new(2, [
      keypairs[0].address,
      keypairs[1].address,
      keypairs[2].address,
      keypairs[3].address,
      keypairs[4].address,
      keypairs[5].address,
      keypairs[6].address,
      keypairs[7].address,
      keypairs[8].address,
      keypairs[9].address,
    ]);

    // Bind the contract to the new address
    const multisig = new Contract(address, keypairs[0], api);

    //Listen for the event
    let newTxExecutedEvent;
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      newTxExecutedEvent = event;
    });

    const addOwnerTx = await buildTransaction(
      api,
      address,
      "add_owner",
      [zetaKeyPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

    // Emit the error in the event
    expect(newTxExecutedEvent).to.exist;
    expect(Object.keys(newTxExecutedEvent.result)).to.include("failed");
    expect(Object.keys(newTxExecutedEvent.result.failed)).to.include(
      "envExecutionFailed"
    );
  });
});
