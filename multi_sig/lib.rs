#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod multi_sig {

    // Import the necessary dependencies
    use ink::{prelude::vec::Vec, storage::Mapping};

    // Defined the types used in the contract
    type TxId = u128;
    type Approvals = u8;
    type Rejections = u8;

    // TODO_ Define the events emitted by the contract

    // TODO_ Define the errors that can be returned

    // Structure that represents a transaction to be performed when the threshold is reached
    #[derive(scale::Decode, scale::Encode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Transaction {
        pub address: AccountId,
        pub selector: [u8; 4],
        pub input: Vec<u8>,
        pub transferred_value: Balance,
        pub gas_limit: u64,
        pub allow_reentry: bool,
    }

    // Structure that represents the multisig contract
    // It contains the list of owners, the threshold, the list of transactions and the list of approvals
    // TODO_ Explain the redundant data structures
    #[ink(storage)]
    #[derive(Default)]
    pub struct MultiSig {
        owners_list: Vec<AccountId>,
        owners: Mapping<AccountId, ()>,
        threshold: u8,
        next_tx_id: TxId,
        transactions_id_list: Vec<TxId>,
        transactions: Mapping<TxId, Transaction>,
        approvals: Mapping<(TxId, AccountId), bool>,
        approvals_count: Mapping<TxId, Approvals>,
        rejections_count: Mapping<TxId, Rejections>,
    }

    impl MultiSig {
        #[ink(constructor)]
        pub fn new() -> Self {
            todo!("Implement the constructor with owners and threshold")
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            todo!(
                "Implement the default constructor caller as owner and default threshold set to 1"
            )
        }

        #[ink(message)]
        pub fn propose_transaction(&mut self) {
            todo!("Implement the propose_transaction message")
        }

        #[ink(message)]
        pub fn approve_transaction(&mut self) {
            todo!("Implement the approve_transaction message")
        }

        #[ink(message)]
        pub fn reject_transaction(&mut self) {
            todo!("Implement the approve_transaction message")
        }

        // TODO: Create messages to add and remove owners and change the threshold

        // TODO: Add read functions to get the list of owners, the threshold and the list of pending transactions
    }

    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// Test if the default constructor does its job.
        #[ink::test]
        fn default_works() {
            // TODO: Check that the default constructior
            assert!(true);
        }

        /// Test custom constructor
        #[ink::test]
        fn custom_constructor_works() {
            // TODO: Create a custom constructor and check that it works
            assert!(true);
        }
    }

    /// Write end-to-end (E2E) or integration tests for ink! contracts.
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::build_message;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// We test that we can upload and instantiate the contract using its default constructor.
        #[ink_e2e::test]
        async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Given
            let constructor = MultiSigRef::default();

            // When
            let contract_account_id = client
                .instantiate("multi_sig", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            // Then
            let get = build_message::<MultiSigRef>(contract_account_id.clone())
                .call(|multi_sig| multi_sig.get());
            let get_result = client.call_dry_run(&ink_e2e::alice(), &get, 0, None).await;
            assert!(matches!(get_result.return_value(), false));

            Ok(())
        }

        //        /// We test that we can read and write a value from the on-chain contract contract.
        //        #[ink_e2e::test]
        //        async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
        //            // Given
        //            let constructor = MultiSigRef::new(false);
        //            let contract_account_id = client
        //                .instantiate("multi_sig", &ink_e2e::bob(), constructor, 0, None)
        //                .await
        //                .expect("instantiate failed")
        //                .account_id;
        //
        //            let get = build_message::<MultiSigRef>(contract_account_id.clone())
        //                .call(|multi_sig| multi_sig.get());
        //            let get_result = client.call_dry_run(&ink_e2e::bob(), &get, 0, None).await;
        //            assert!(matches!(get_result.return_value(), false));
        //
        //            // When
        //            let flip = build_message::<MultiSigRef>(contract_account_id.clone())
        //                .call(|multi_sig| multi_sig.flip());
        //            let _flip_result = client
        //                .call(&ink_e2e::bob(), flip, 0, None)
        //                .await
        //                .expect("flip failed");
        //
        //            // Then
        //            let get = build_message::<MultiSigRef>(contract_account_id.clone())
        //                .call(|multi_sig| multi_sig.get());
        //            let get_result = client.call_dry_run(&ink_e2e::bob(), &get, 0, None).await;
        //            assert!(matches!(get_result.return_value(), true));
        //
        //            Ok(())
        //        }
    }
}
