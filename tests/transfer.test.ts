import { expect } from "chai";
import Constructors from "../typed_contracts/constructors/multisig";
import Contract from "../typed_contracts/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import ContractAbi from "../artifacts/multisig.json";
import { Transaction } from "../typed_contracts/types-arguments/multisig";
import { MessageIndex } from "./utils/MessageIndex";

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

describe("Transfer function", () => {
  it("Should transfer funds to Bob", async () => {
    // Index that allows to get the selector of a message by its label
    const multisigMessageIndex = new MessageIndex(ContractAbi);

    // Initial accounts
    const aliceKeyringPair = keyring.addFromUri("//Alice");
    const bobKeyringPair = keyring.addFromUri("//Bob");

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);
    const { address: multisigAddress } = await constructors.default();
    expect(multisigAddress).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(multisigAddress, aliceKeyringPair, api);

    // Multisig initial balance
    const multisigInitialBalance = await api.query.system.account(
      multisigAddress
    );

    // Transfer funds to the multisig contract
    const transferAmount = 1000000000000000;
    const transfer = api.tx.balances.transfer(multisigAddress, transferAmount);
    await transfer.signAndSend(aliceKeyringPair);

    // Check the updated multisig balance
    const multisigBalance = await api.query.system.account(multisigAddress);
    expect(multisigBalance.data.free.toBigInt()).to.equal(
      multisigInitialBalance.data.free.toBigInt() + BigInt(transferAmount)
    );

    // Now we can transfer funds from the multisig contract to Bob
    const selector =
      multisigMessageIndex.getMessageInfo("transfer")?.selector.bytes;
    const amountToTransfer = 23;
    let args = multisigMessageIndex.transformArgsToBytes(api, "transfer", [
      bobKeyringPair.address,
      amountToTransfer,
    ]);

    const transferTx: Transaction = {
      address: multisigAddress,
      selector: selector!,
      input: args,
      transferredValue: 0,
      gasLimit: 100000000000,
      allowReentry: true,
    };

    // Get the balance of Bob before the transfer
    const bobBalanceBefore = await api.query.system.account(
      bobKeyringPair.address
    );

    // Propose the transaction on chain
    await multisig.tx.proposeTx(transferTx);

    // Check the balance of Bob after the transfer
    const bobBalanceAfter = await api.query.system.account(
      bobKeyringPair.address
    );

    expect(bobBalanceAfter.data.free.toBigInt()).to.equal(
      bobBalanceBefore.data.free.toBigInt() + BigInt(amountToTransfer)
    );
  });
  
  it("Should fail to transfer funds to Bob because of insufficient funds", async () => {
    // Index that allows to get the selector of a message by its label
    const multisigMessageIndex = new MessageIndex(ContractAbi);

    // Initial accounts
    const aliceKeyringPair = keyring.addFromUri("//Alice");
    const bobKeyringPair = keyring.addFromUri("//Bob");

    // Create a new contract
    const constructors = new Constructors(api, aliceKeyringPair);
    const { address: multisigAddress } = await constructors.default();
    expect(multisigAddress).to.exist;

    // Bind the contract to the new address
    const multisig = new Contract(multisigAddress, aliceKeyringPair, api);

    // Multisig initial balance
    const multisigInitialBalance = await api.query.system.account(
      multisigAddress
    );

    const amountToTransfer = 1230000000000;

    // Check that the amount to transfer is greater than the multisig balance
    expect(multisigInitialBalance.data.free.toBigInt() < BigInt(amountToTransfer)).to.be.true;

    // Now we can create the transfer tx from the multisig contract to Bob
    const selector =
      multisigMessageIndex.getMessageInfo("transfer")?.selector.bytes;
    let args = multisigMessageIndex.transformArgsToBytes(api, "transfer", [
      bobKeyringPair.address,
      amountToTransfer,
    ]);

    const transferTx: Transaction = {
      address: multisigAddress,
      selector: selector!,
      input: args,
      transferredValue: 0,
      gasLimit: 100000000000,
      allowReentry: true,
    };

    // Variable that will store the event received when the transaction is executed
    let transferEvent;

    // Before executing the transaction, we will subscribe to the Executed event
    // in order to check that the transaction has failed
    multisig.events.subscribeOnTransactionExecutedEvent((event) => {
      console.log('Transaction executed event received:', event);
      transferEvent = event;
    });

    // Execute the transaction on chain
    await multisig.tx.proposeTx(transferTx);
    
    //TODO: This check might not work because of a race condition between the event handler and the check
    expect(transferEvent).to.have.nested.property('result.failed.envExecutionFailed', null);
  });

});
