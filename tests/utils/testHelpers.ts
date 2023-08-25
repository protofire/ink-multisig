import { expect } from "chai";
import Contract from "../../typed_contracts/multisig/contracts/multisig";
import Constructors from "../../typed_contracts/multisig/constructors/multisig";

let init_threshold = 2;

export const assignKeyringPairs = (keyring) => {
  let aliceKeyringPair = keyring.addFromUri("//Alice");
  let bobKeyringPair = keyring.addFromUri("//Bob");
  let charlieKeyringPair = keyring.addFromUri("//Charlie");
  let daveKeyringPair = keyring.addFromUri("//Dave");
  return [
    aliceKeyringPair,
    bobKeyringPair,
    charlieKeyringPair,
    daveKeyringPair,
  ];
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
