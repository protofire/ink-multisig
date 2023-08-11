import { expect } from "chai";
import Constructors from "../typed_contracts/multisig/constructors/multisig";
import Contract from "../typed_contracts/multisig/contracts/multisig";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { Transaction } from "../typed_contracts/multisig/types-arguments/multisig";
import { MessageIndex } from "./utils/MessageIndex";
import { deployExternalContracts } from "./utils/contractsDeployment";

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

describe("Test payable message", () => {
  it("Should transfer funds from multisig to other contract", async () => {

    let payableContractAddress =
      externalContracts["payable_contract.contract"].address;
    let PayableContract = externalContracts["payable_contract.contract"].abi;

    const payableContractMessageIndex = new MessageIndex(PayableContract);

    const aliceKeyringPair = keyring.addFromUri("//Alice");

    // Create a new multisig contract
    const constructors = new Constructors(api, aliceKeyringPair);

    const { address: multisigAddress } = await constructors.new(1, [aliceKeyringPair.address])

    // Bind the contract to the new address
    const multisig = new Contract(multisigAddress, aliceKeyringPair, api);

    // Multisig initial balance
    const multisigInitialBalance = await api.query.system.account(
      multisigAddress
    );
    //console.log("Multisig initial balance: ", multisigInitialBalance.data.free.toNumber());

    // Transfer funds to the multisig contract
    const transferAmount = 1000000000000000;
    const transfer = api.tx.balances.transfer(multisigAddress, transferAmount);
    await transfer.signAndSend(aliceKeyringPair);

    // Check the updated multisig balance
    const multisigBalance = await api.query.system.account(multisigAddress);
    //console.log("Multisig balance after transfer: ", multisigBalance.data.free.toNumber());
    expect(multisigBalance.data.free.toBigInt()).to.equal(
      BigInt(transferAmount) + multisigInitialBalance.data.free.toBigInt()
    );

    // Payable contract initial balance
    const payableContractInitialBalance = await api.query.system.account(
      payableContractAddress
    );
    //console.log("Payable contract initial balance: ", payableContractInitialBalance.data.free.toNumber());

    // Get the selector of the add_owner message
    const selector =
      payableContractMessageIndex.getMessageInfo("deposit_funds")?.selector.bytes;

    // Create the transaction
    const depositFundsTx: Transaction = {
      address: payableContractAddress,
      selector: selector!,
      input: [],
      transferredValue: transferAmount,
      gasLimit: 100000000000,
      allowReentry: false,
    };

    // Propose the transaction on chain
    await multisig.tx.proposeTx(depositFundsTx);

    // Check the updated payable contract balance
    const payableContractBalance = await api.query.system.account(
      payableContractAddress
    );
    //console.log("Payable contract balance after transfer: ", payableContractBalance.data.free.toNumber());
    expect(payableContractBalance.data.free.toBigInt()).to.equal(
      payableContractInitialBalance.data.free.toBigInt() + BigInt(transferAmount)
    );
  });
});
