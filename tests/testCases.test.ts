import { expect } from "chai";
import Constructors from "../typed_contracts/multisig/constructors/multisig";
import Contract from "../typed_contracts/multisig/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import ContractAbi from "../artifacts/multisig/multisig.json";
import { Transaction } from "../typed_contracts/multisig/types-arguments/multisig";
import { MessageIndex } from "./utils/MessageIndex";
import { hex_to_bytes } from "./utils/convertions";

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

describe("Case 1", () => {
  it("Should add a new owner", async () => {
    // Index that allows to get the selector of a message by its label
    const multisigMessageIndex = new MessageIndex(ContractAbi);

    // Initial args
    const init_threshold = 2;
    const aliceKeyringPair = keyring.addFromUri("//Alice");
    const bobKeyringPair = keyring.addFromUri("//Bob");
    const charlieKeyringPair = keyring.addFromUri("//Charlie");
    const daveKeyringPair = keyring.addFromUri("//Dave");

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(init_threshold, [
      aliceKeyringPair.address,
      bobKeyringPair.address,
      charlieKeyringPair.address,
    ]);
    expect(address).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    // Check the initial state
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);

    const owners = (await multisig.query.getOwners()).value.unwrap();
    expect(owners).to.have.lengthOf(3);

    // Get the arguments for the proposeTx contract call

    // Get the selector of the add_owner message
    const selector = multisigMessageIndex.getMessageInfo("add_owner")?.selector.bytes;

    // Create the argument for the add_owner message in the specified format
    const arg = api.createType("AccountId", daveKeyringPair.address);
    const arg_hex = arg.toHex();

    const addOwnerTx: Transaction = {
      address: address,
      selector: selector!,
      input: hex_to_bytes(arg_hex),
      transferredValue: 0,
      gasLimit: 100000000000,
      allowReentry: true,
    };

    // Propose the transaction on chain
    await multisig.tx.proposeTx(addOwnerTx);

    // Check the state after the proposeTx call
    let tx = await multisig.query.getTx(0);
    expect(tx).to.exist;

    // The proposed transaction has 1 approval and 0 rejections
    const approvals = (await multisig.query.getTxApprovals(0)).value.ok;
    expect(approvals).to.equal(1);

    const rejections = (await multisig.query.getTxRejections(0)).value.ok;
    expect(rejections).to.equal(0);

    // Approve the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.approveTx(0);

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
});

describe("Case 2", () => {
  it("Should not add a new owner", async () => {
    // Index that allows to get the selector of a message by its label
    const multisigMessageIndex = new MessageIndex(ContractAbi);

    // Initial args
    const init_threshold = 2;
    const aliceKeyringPair = keyring.addFromUri("//Alice");
    const bobKeyringPair = keyring.addFromUri("//Bob");
    const charlieKeyringPair = keyring.addFromUri("//Charlie");
    const daveKeyringPair = keyring.addFromUri("//Dave");

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(init_threshold, [
      aliceKeyringPair.address,
      bobKeyringPair.address,
      charlieKeyringPair.address,
    ]);
    expect(address).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    // Check the initial state
    const threshold = (await multisig.query.getThreshold()).value.unwrap();
    expect(threshold).to.equal(2);

    const owners = (await multisig.query.getOwners()).value.unwrap();
    expect(owners).to.have.lengthOf(3);

    // Get the arguments for the proposeTx contract call

    // Get the selector of the add_owner message
    const selector = multisigMessageIndex.getMessageInfo("add_owner")?.selector.bytes;

    // Create the argument for the add_owner message in the specified format
    const arg = api.createType("AccountId", daveKeyringPair.address);
    const arg_hex = arg.toHex();

    const addOwnerTx: Transaction = {
      address: address,
      selector: selector!,
      input: hex_to_bytes(arg_hex),
      transferredValue: 0,
      gasLimit: 100000000000,
      allowReentry: true,
    };

    // Propose the transaction on chain
    await multisig.tx.proposeTx(addOwnerTx);

    // Check the state after the proposeTx call
    let tx = await multisig.query.getTx(0);
    expect(tx).to.exist;

    // The proposed transaction has 1 approval and 0 rejections
    const approvals = (await multisig.query.getTxApprovals(0)).value.ok;
    expect(approvals).to.equal(1);

    const rejections = (await multisig.query.getTxRejections(0)).value.ok;
    expect(rejections).to.equal(0);

    // Reject the transaction by Bob
    await multisig.withSigner(bobKeyringPair).tx.rejectTx(0);
    //TODO: check approvals and rejections

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
});
