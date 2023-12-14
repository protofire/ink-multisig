import { expect } from "chai";
import MultisigConstructors from "../../typed_contracts/multisig/constructors/multisig";
import MultisigContract from "../../typed_contracts/multisig/contracts/multisig";
import Psp22Contract from "../../typed_contracts/psp-standards/psp22/contracts/my_psp22_metadata";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { ContractInterface } from "../utils/ContractInterface";
import { deployExternalContracts } from "../utils/contractsDeployment";
import { assignKeyringPairs } from "../utils/testHelpers";
import { Transaction } from "../../typed_contracts/multisig/types-arguments/multisig";

let api;
let keyring;
let externalContracts;

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

    // Deploy external contracts
    externalContracts = await deployExternalContracts(api, keyring);
  } catch (error) {
    console.error(error);
    process.exit(1); // Terminate the execution
  }
});

after(() => {
  // Disconnect from the API on completion
  api.disconnect();
});

describe("Test transfer message", () => {
  it("Should transfer psp22 tokens from Alice to multisig", async () => {
    const psp22ContractAddress = externalContracts["psp22.contract"].address;

    const aliceKeyringPair = assignKeyringPairs(keyring, 1)[0];

    // Create a new multisig contract
    const constructors = new MultisigConstructors(api, aliceKeyringPair);

    const { address: multisigAddress } = await constructors.new(1, [
      aliceKeyringPair.address,
    ]);

    // Bind the multisig contract to the new address
    const multisig = new MultisigContract(
      multisigAddress,
      aliceKeyringPair,
      api
    );

    // Bind the psp22 contract to the new address
    const psp22Contract = new Psp22Contract(
      psp22ContractAddress,
      aliceKeyringPair,
      api
    );

    // Check the balance of Alice, who is the one who deployed the token
    const aliceBalanceBefore = (
      await psp22Contract.query.balanceOf(aliceKeyringPair.address)
    ).value.unwrap();

    // Check the balance of the multisig contract
    const multisigBalanceBefore = (
      await psp22Contract.query.balanceOf(multisigAddress)
    ).value.unwrap();

    // Transfer 100 tokens from Alice to the multisig contract
    await psp22Contract.tx.transfer(multisigAddress, 100, []);

    // Check the balance of Alice, who is the one who deployed the token
    const aliceBalanceAfter = (
      await psp22Contract.query.balanceOf(aliceKeyringPair.address)
    ).value.unwrap();
    expect(aliceBalanceAfter.toString()).to.equal("99900");

    // Check the balance of the multisig contract
    const multisigBalanceAfter = (
      await psp22Contract.query.balanceOf(multisigAddress)
    ).value.unwrap();
    expect(multisigBalanceAfter.toString()).to.equal("100");
  });

  it("Should transfer psp22 tokens from multisig to Bob", async () => {
    let psp22ContractAddress = externalContracts["psp22.contract"].address;
    const psp22ContractAbi = externalContracts["psp22.contract"].abi;
    const psp22ContractInterface = new ContractInterface(api, psp22ContractAbi);

    const [aliceKeyringPair, bobKeyringPair] = assignKeyringPairs(keyring, 2);
    const tokenReceiver = bobKeyringPair.address;

    // Create a new multisig contract
    const constructors = new MultisigConstructors(api, aliceKeyringPair);

    const { address: multisigAddress } = await constructors.new(1, [
      aliceKeyringPair.address,
    ]);

    // Bind the multisig contract to the new address
    const multisig = new MultisigContract(
      multisigAddress,
      aliceKeyringPair,
      api
    );

    // Bind the psp22 contract to the new address
    const psp22Contract = new Psp22Contract(
      psp22ContractAddress,
      aliceKeyringPair,
      api
    );

    // Transfer 100 tokens from Alice to the multisig contract
    await psp22Contract.tx.transfer(multisigAddress, 100, []);

    // Create Tx
    let args = [tokenReceiver, 20, []];
    let convertedArgs = psp22ContractInterface.transformArgsToBytes(
      "psp22::transfer",
      args
    );

    let selector = psp22ContractInterface
      .getMessageInfo("psp22::transfer")
      ?.selector.toU8a()!;

    const psp22TransferTx: Transaction = {
      address: psp22ContractAddress,
      selector: Array.from(selector),
      input: convertedArgs,
      transferredValue: 0,
      gasLimit: 0,
      allowReentry: false,
    };

    // Propose the transaction on chain
    await multisig.tx.proposeTx(psp22TransferTx);

    // Check the updated multisig balance
    const multisigBalance = await psp22Contract.query.balanceOf(
      multisigAddress
    );
    expect(multisigBalance.value.unwrap().toString()).to.equal("80");

    // Check the updated Bob balance
    const bobBalanceAfter = await psp22Contract.query.balanceOf(tokenReceiver);
    expect(bobBalanceAfter.value.unwrap().toString()).to.equal("20");
  });
});
