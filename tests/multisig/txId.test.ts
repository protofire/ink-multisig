import { expect } from "chai";
import Constructors from "../../typed_contracts/multisig/constructors/multisig";
import ContractAbi from "../../artifacts/multisig/multisig.json";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import {
  assignKeyringPairs,
  buildTransaction,
  proposeTransaction,
} from "../utils/testHelpers";
import { MessageIndex } from "../utils/MessageIndex";
import Contract from "../../typed_contracts/multisig/contracts/multisig";

let api;
let keyring;
let keypairs;
let aliceKeyringPair;
let bobKeyringPair;
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

describe("TxId Test", () => {
  before(() => {
    // call function to create keyring pairs
    keypairs = assignKeyringPairs(keyring, 2);
    [aliceKeyringPair, bobKeyringPair] = keypairs;
  });

  it("TxId should increment", async () => {
    multisigMessageIndex = new MessageIndex(ContractAbi);

    // Initial args
    const init_threshold = 1;

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address } = await constructors.new(init_threshold, [
      aliceKeyringPair.address,
    ]);

    // Assert that the contract was created
    expect(address).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(address, aliceKeyringPair, api);

    const addOwnerTx = await buildTransaction(
      api,
      address,
      "add_owner",
      [bobKeyringPair.address],
      multisigMessageIndex
    );

    // Propose the transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

    // Propose the same transaction on chain
    await proposeTransaction(multisig, addOwnerTx);

    // Check that the txId has been incremented
    const nextTxId = (await multisig.query.getNextTxId()).value
      .unwrap()
      .toNumber();
    expect(nextTxId).to.equal(2);
  });
});
