#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod multisig_factory {

    use ink::prelude::vec::Vec;
    use ink::ToAccountId;
    use multisig::MultiSigRef;

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
            let multisig_ins = MultiSigRef::new(threshold, owners_list)
                .code_hash(self.multisig_codehash)
                .endowment(0)
                .salt_bytes(salt)
                .instantiate();

            match multisig_ins {
                Ok(multisig) => {
                    let multisig_address = multisig.to_account_id();
                    self.env().emit_event(NewMultisig {
                        //TODO: Fix emit event error. Follow https://github.com/paritytech/ink/pull/1827
                        multisig_address,
                        threshold,
                        owners_list,
                    });
                    Ok(())
                }
                Err(_) => Err(Error::InstantiationFailed),
            }
        }
    }
}
