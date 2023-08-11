#![cfg_attr(not(feature = "std"), no_std, no_main)]

//!
//! # MultiSigFactory
//!
//! This file contains the implementation of the MultiSigFactory contract.
//!
//! ## Overview:
//! The MultiSigFactory contract is used to deploy new MultiSig contracts to
//! keep track of the deployed MultiSig contracts and creation parameters.
//!
//! ## DISCLAIMER
//!
//! This contract is not audited and should not be used in production. Use it under your own risk.
//!

#[ink::contract]
mod multisig_factory {

    // Import the necessary dependencies.
    use ink::codegen::EmitEvent;
    use ink::prelude::vec::Vec;
    use ink::ToAccountId;
    use multisig::MultiSigRef;

    /// The type encapsulating the events emitted by this contract.
    type Event = <MultiSigFactory as ink::reflect::ContractEventBase>::Type;

    /// NewMultisig event emitted when a new MultiSig contract is deployed.
    #[ink(event)]
    pub struct NewMultisig {
        /// The address of the deployed MultiSig contract.
        #[ink(topic)]
        multisig_address: AccountId,
        /// The threshold of the deployed MultiSig contract.
        threshold: u8,
        /// The list of owners of the deployed MultiSig contract.
        owners_list: Vec<AccountId>,
        /// The salt used to deploy the MultiSig contract.
        salt: Vec<u8>,
    }

    /// Error type for the MultiSigFactory contract.
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// The contract instantiation has failed.
        InstantiationFailed,
    }

    /// The MultiSigFactory struct to store the codehash of the MultiSig
    #[ink(storage)]
    #[derive(Default)]
    pub struct MultiSigFactory {
        /// The codehash of the MultiSig contract.
        multisig_codehash: Hash,
    }

    impl MultiSigFactory {
        /// Constructor that stores the codehash of the MultiSig contract.
        #[ink(constructor)]
        pub fn new(codehash: Hash) -> Result<Self, Error> {
            Ok(Self {
                multisig_codehash: codehash,
            })
        }

        /// Deploy a new MultiSig contract.
        /// The threshold and owners_list are passed as parameters.
        /// The salt is passed as a parameter.
        /// The multisig address is emitted as an event with the threshold and
        /// owners_list.
        #[ink(message)]
        pub fn new_multisig(
            &mut self,
            threshold: u8,
            owners_list: Vec<AccountId>,
            salt: Vec<u8>,
        ) -> Result<(), Error> {
            let multisig_ins = MultiSigRef::new(threshold, owners_list.clone())
                .code_hash(self.multisig_codehash)
                .endowment(0)
                .salt_bytes(salt.clone())
                .instantiate();

            match multisig_ins {
                Ok(multisig) => {
                    let multisig_address = multisig.to_account_id();
                    Self::emit_event(
                        Self::env(),
                        Event::NewMultisig(NewMultisig {
                            multisig_address,
                            threshold,
                            owners_list,
                            salt,
                        }),
                    );
                    Ok(())
                }
                Err(_) => Err(Error::InstantiationFailed),
            }
        }

        // We need this helper method for emitting events (rather than
        // `Self::env().emit_event(_)`) because compiler will fail to
        // resolve type boundaries if there are events from another, dependent
        // contract. To verify, try replacing calls to
        // `Self::emit_event` with `self::env().emit_event(_)` in the
        // `../lib.rs`.
        // This was taken from: https://github.com/Cardinal-Cryptography/bulletin-board-example/blob/main/contracts/highlighted_posts/lib.rs
        fn emit_event<EE>(emitter: EE, event: Event)
        where
            EE: EmitEvent<MultiSigFactory>,
        {
            emitter.emit_event(event);
        }
    }
}
