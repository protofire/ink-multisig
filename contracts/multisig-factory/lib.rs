#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod multisig_factory {

    use ink::codegen::EmitEvent;
    use ink::prelude::vec::Vec;
    use ink::ToAccountId;
    use multisig::MultiSigRef;

    type Event = <MultiSigFactory as ink::reflect::ContractEventBase>::Type;

    #[ink(event)]
    pub struct NewMultisig {
        #[ink(topic)]
        multisig_address: AccountId,
        threshold: u8,
        owners_list: Vec<AccountId>,
    }

    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// The contract instantiation failed.
        InstantiationFailed,
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct MultiSigFactory {
        multisig_codehash: Hash,
    }

    impl MultiSigFactory {
        #[ink(constructor)]
        pub fn new(codehash: Hash) -> Result<Self, Error> {
            Ok(Self {
                multisig_codehash: codehash,
            })
        }

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
                .salt_bytes(salt)
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
