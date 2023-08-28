import { expect } from "chai";
import { hex_to_bytes } from "./convertions";
import Contract from "../../typed_contracts/multisig/contracts/multisig";
import Constructors from "../../typed_contracts/multisig/constructors/multisig";
import { Transaction } from "../../typed_contracts/multisig/types-arguments/multisig";

let init_threshold = 2;

export const assignKeyringPairs = (keyring, size) => {
  const aliceKeyringPair = keyring.addFromUri("//Alice");
  const bobKeyringPair = keyring.addFromUri("//Bob");
  const charlieKeyringPair = keyring.addFromUri("//Charlie");
  const daveKeyringPair = keyring.addFromUri("//Dave");
  const eveKeyringPair = keyring.addFromUri("//Eve");
  const ferdieKeyringPair = keyring.addFromUri("//Ferdie");
  const georgeKeyringPair = keyring.addFromUri("//George");
  const hannahKeyringPair = keyring.addFromUri("//Hannah");
  const idaKeyringPair = keyring.addFromUri("//Ida");
  const johnKeyringPair = keyring.addFromUri("//John");
  const keypairs = [
    aliceKeyringPair,
    bobKeyringPair,
    charlieKeyringPair,
    daveKeyringPair,
    eveKeyringPair,
    ferdieKeyringPair,
    georgeKeyringPair,
    hannahKeyringPair,
    idaKeyringPair,
    johnKeyringPair,
  ];

  return keypairs.slice(0, size);
};

export const createABCMultiSigAndEnsureState = async (api, keypairs) => {
  // Create a new contract
  const constructors = new Constructors(api, keypairs[0]);

  const { address } = await constructors.new(init_threshold, [
    keypairs[0].address,
    keypairs[1].address,
    keypairs[2].address,
  ]);
  expect(address).to.exist;

  // Bind the contract to the new address
  const multisig = new Contract(address, keypairs[0], api);

  // Check the initial state
  const threshold = (await multisig.query.getThreshold()).value.unwrap();
  expect(threshold).to.equal(2);
  const owners = (await multisig.query.getOwners()).value.unwrap();
  expect(owners).to.have.lengthOf(3);

  return [address, multisig];
};

export const buildTransaction = (
  api,
  senderAddress,
  addressToAdd,
  multisigMessageIndex
) => {
  // Get the selector of the add_owner message
  const selector =
    multisigMessageIndex.getMessageInfo("add_owner")?.selector.bytes;

  // Create the argument for the add_owner message in the specified format
  const arg = api.createType("AccountId", addressToAdd);
  const arg_hex = arg.toHex();

  const addOwnerTx: Transaction = {
    address: senderAddress,
    selector: selector!,
    input: hex_to_bytes(arg_hex),
    transferredValue: 0,
    gasLimit: 100000000000,
    allowReentry: true,
  };

  return addOwnerTx;
};

export const proposeTransaction = async (multisig, addOwnerTx) => {
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
};
