#![cfg_attr(not(feature = "std"), no_std, no_main)]

pub use self::multisig::MultiSigRef;

#[ink::contract]
mod multisig {

    // Import the necessary dependencies
    use ink::LangError;
    use ink::{
        codegen::EmitEvent,
        env::{
            call::{build_call, ExecutionInput},
            CallFlags, Error as EnvError,
        },
        prelude::vec::Vec,
        storage::Mapping,
    };
    use openbrush::traits::Flush;
    use scale::Output;

    // Defined the types used in the contract
    type TxId = u128;
    type Approvals = u8;
    type Rejections = u8;

    // Define the constants used in the contract
    const MAX_OWNERS: u8 = 10; //TODO Review this value and add justification
    const MAX_TRANSACTIONS: u8 = 10; //TODO Review this value and add justification

    // Struct to SCALE encode the input of the call
    struct InputArgs<'a>(&'a [u8]);

    impl<'a> scale::Encode for InputArgs<'a> {
        fn encode_to<T: Output + ?Sized>(&self, dest: &mut T) {
            dest.write(self.0);
        }
    }

    type Event = <MultiSig as ink::reflect::ContractEventBase>::Type;

    #[ink(event)]
    pub struct ThresholdChanged {
        #[ink(topic)]
        threshold: u8,
    }

    #[ink(event)]
    pub struct OwnerAdded {
        #[ink(topic)]
        owner: AccountId,
    }

    #[ink(event)]
    pub struct OwnerRemoved {
        #[ink(topic)]
        owner: AccountId,
    }

    #[ink(event)]
    pub struct TransactionProposed {
        #[ink(topic)]
        tx_id: TxId,
        #[ink(topic)]
        contract_address: AccountId,
        selector: [u8; 4],
        input: Vec<u8>,
        transferred_value: Balance,
        gas_limit: u64,
        allow_reentry: bool,
    }

    #[ink(event)]
    pub struct Approve {
        #[ink(topic)]
        tx_id: TxId,
        #[ink(topic)]
        owner: AccountId,
    }

    #[ink(event)]
    pub struct Reject {
        #[ink(topic)]
        tx_id: TxId,
        #[ink(topic)]
        owner: AccountId,
    }

    #[ink(event)]
    pub struct TransactionExecuted {
        #[ink(topic)]
        tx_id: TxId,
        result: TxResult,
    }

    #[ink(event)]
    pub struct TransactionRemoved {
        #[ink(topic)]
        tx_id: TxId,
    }

    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        to: AccountId,
        value: Balance,
    }

    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum TxResult {
        Success(Vec<u8>),
        Failed(Error),
    }

    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum WrappedEnvError {
        /// Error upon decoding an encoded value.
        Decode,
        // The call to another contract has trapped.
        CalleeTrapped,
        /// The call to another contract has been reverted.
        CalleeReverted,
        /// Transfer failed for other not further specified reason. Most probably
        /// reserved or locked balance of the sender that was preventing the transfer.
        TransferFailed,
        /// The account that was called is no contract, but a plain account.
        NotCallable,
        /// An unexpected error occurred.
        Unexpected,
    }

    // TODO_ Define the errors that can be returned
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Env error encountered when executing the transaction
        EnvExecutionFailed(WrappedEnvError),
        /// Transaction executed but Lang error encountered
        LangExecutionFailed(LangError),
        /// The owners list cannot be empty
        OwnersCantBeEmpty,
        /// The threshold cannot be greater than the number of owners
        ThresholdGreaterThanOwners,
        /// The threshold cannot be zero
        ThresholdCantBeZero,
        /// The transaction can only be executed by the multisig contract itself
        Unauthorized,
        /// No more owners can be added
        MaxOwnersReached,
        /// The owner already exists
        OwnerAlreadyExists,
        /// The caller is not an owner
        NotOwner,
        /// The maximum number of active transactions has been reached
        MaxTransactionsReached,
        /// The transaction Id has overflowed
        TxIdOverflow,
        /// The caller has already voted
        AlreadyVoted,
        /// The transaction Id is not valid
        InvalidTxId,
        /// The transfer has failed
        TransferFailed,
    }

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
    // The presence of redundant information between owners_list and owners, and transactions_id_list and transactions
    // is intentional to make it easier the elements access.
    // Although they represent the same TxId, this redundancy is maintained in order to support efficient iteration over
    // 'transactions_id_list' while fetching a transaction. By duplicating the tx IDs, we achieve a constant time complexity of
    // O(1) when accessing tx information directly from 'transacctions'.
    #[ink(storage)]
    #[derive(Default)]
    pub struct MultiSig {
        owners_list: Vec<AccountId>,
        owners: Mapping<AccountId, ()>,
        threshold: u8,
        next_tx_id: TxId,
        txs_id_list: Vec<TxId>,
        txs: Mapping<TxId, Transaction>,
        approvals: Mapping<(TxId, AccountId), bool>,
        approvals_count: Mapping<TxId, Approvals>,
        rejections_count: Mapping<TxId, Rejections>,
    }

    impl MultiSig {
        #[ink(constructor)]
        pub fn new(threshold: u8, mut owners_list: Vec<AccountId>) -> Result<Self, Error> {
            // Remove duplicated owners
            owners_list.sort_unstable();
            owners_list.dedup();

            // Check that the threshold and owners are valid
            ensure_creation_params(threshold, &owners_list)?;

            let mut owners = Mapping::new();

            for owner in &owners_list {
                owners.insert(owner, &());
            }

            Ok(Self {
                owners_list,
                owners,
                threshold,
                next_tx_id: 0,
                txs_id_list: Vec::new(),
                txs: Mapping::new(),
                approvals: Mapping::new(),
                approvals_count: Mapping::new(),
                rejections_count: Mapping::new(),
            })
        }

        // Default constructor will create a contract wallet
        // Just a single owner (the caller) and a threshold of 1
        #[ink(constructor)]
        pub fn default() -> Result<Self, Error> {
            let mut owners = Mapping::new();
            let mut owners_list = Vec::new();
            owners.insert(Self::env().caller(), &());
            owners_list.push(Self::env().caller());

            // sets the threshold to 1
            Ok(Self {
                owners_list,
                owners,
                threshold: 1,
                next_tx_id: 0,
                txs_id_list: Vec::new(),
                txs: Mapping::new(),
                approvals: Mapping::new(),
                approvals_count: Mapping::new(),
                rejections_count: Mapping::new(),
            })
        }

        #[ink(message)]
        pub fn propose_tx(&mut self, tx: Transaction) -> Result<(), Error> {
            // Check that the caller is an owner
            self.ensure_is_owner(self.env().caller())?;

            // Check that the maximum number of transactions has not been reached
            if self.txs_id_list.len() as u8 == MAX_TRANSACTIONS {
                return Err(Error::MaxTransactionsReached);
            }

            // Handle next_tx_id
            let current_tx_id = self.next_tx_id;
            self.next_tx_id = current_tx_id.checked_add(1).ok_or(Error::TxIdOverflow)?;

            // Store the transaction
            self.txs_id_list.push(current_tx_id);
            // ink_storage::lazy::mapping::Mapping receives a reference, so we are passing a &transaction
            self.txs.insert(current_tx_id, &tx);

            // Initialize the approvals count with 1 approval and 0 rejections
            self.approvals_count.insert(current_tx_id, &1);
            self.rejections_count.insert(current_tx_id, &0);

            self.approvals
                .insert((current_tx_id, self.env().caller()), &true);

            Self::emit_event(
                Self::env(),
                Event::TransactionProposed(TransactionProposed {
                    tx_id: current_tx_id,
                    contract_address: tx.address,
                    selector: tx.selector,
                    input: tx.input,
                    transferred_value: tx.transferred_value,
                    gas_limit: tx.gas_limit,
                    allow_reentry: tx.allow_reentry,
                }),
            );

            // If threshold is reached when proposed (threshold == 1), execute the transaction
            self.try_execute_tx(current_tx_id);

            Ok(())
        }

        #[ink(message)]
        pub fn approve_tx(&mut self, tx_id: TxId) -> Result<(), Error> {
            // perform checks
            self.perform_approval_rejection_checking(tx_id)?;
            self.approve(tx_id)?;

            Self::emit_event(
                Self::env(),
                Event::Approve(Approve {
                    tx_id,
                    owner: self.env().caller(),
                }),
            );

            self.try_execute_tx(tx_id);
            Ok(())
        }

        #[ink(message)]
        pub fn reject_tx(&mut self, tx_id: TxId) -> Result<(), Error> {
            // perform checks
            self.perform_approval_rejection_checking(tx_id)?;
            self.reject(tx_id)?;

            Self::emit_event(
                Self::env(),
                Event::Reject(Reject {
                    tx_id,
                    owner: self.env().caller(),
                }),
            );

            self.try_remove_tx(tx_id);
            Ok(())
        }

        #[ink(message)]
        pub fn try_execute_tx(&mut self, tx_id: TxId) {
            // check threshold met
            if self.check_threshold_met(tx_id) {
                // execute transaction
                self.execute_tx(tx_id);
            }
        }

        #[ink(message)]
        pub fn try_remove_tx(&mut self, tx_id: TxId) {
            // check if threshold can be met with the remaining approvals
            if !self.check_threshold_can_be_met(tx_id) {
                // delete transaction
                self.remove_tx(tx_id);
            }
        }

        // Owner management
        #[ink(message)]
        pub fn add_owner(&mut self, owner: AccountId) -> Result<(), Error> {
            // Check that caller is multisig
            self.ensure_self_call()?;

            // Check that owners are not greater than MAX_OWNERS
            if self.owners_list.len() as u8 == MAX_OWNERS {
                return Err(Error::MaxOwnersReached);
            }

            // Check that owner is not already an owner
            if self.owners.contains(owner) {
                return Err(Error::OwnerAlreadyExists);
            }

            // Add the owner
            self.owners.insert(owner, &());
            self.owners_list.push(owner);

            // emit event
            Self::emit_event(Self::env(), Event::OwnerAdded(OwnerAdded { owner }));

            Ok(())
        }

        #[ink(message)]
        pub fn remove_owner(&mut self, owner: AccountId) -> Result<(), Error> {
            // Check that caller is multisig
            self.ensure_self_call()?;

            // Check that owner is actually an owner
            self.ensure_is_owner(owner)?;

            let owners_count = self.owners_list.len();

            // Check that owners are not empty after removing
            if owners_count == 1 {
                return Err(Error::OwnersCantBeEmpty);
            }

            // Check that threshold is not greater than owners after removing
            if self.threshold > (owners_count - 1) as u8 {
                return Err(Error::ThresholdGreaterThanOwners);
            }

            // Remove the owner
            self.owners.remove(owner);
            self.owners_list.retain(|&x| x != owner);

            // emit event
            Self::emit_event(Self::env(), Event::OwnerRemoved(OwnerRemoved { owner }));

            Ok(())
        }

        #[ink(message)]
        pub fn change_threshold(&mut self, threshold: u8) -> Result<(), Error> {
            // Check that caller is multisig
            self.ensure_self_call()?;

            // Check that threshold is not greater than owners
            if threshold > self.owners_list.len() as u8 {
                return Err(Error::ThresholdGreaterThanOwners);
            }

            // Check that threshold is not zero
            if threshold == 0 {
                return Err(Error::ThresholdCantBeZero);
            }

            // Change the threshold
            self.threshold = threshold;

            // emit event
            Self::emit_event(
                Self::env(),
                Event::ThresholdChanged(ThresholdChanged { threshold }),
            );

            Ok(())
        }

        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, value: Balance) -> Result<(), Error> {
            // Check that caller is multisig
            self.ensure_self_call()?;

            // Transfer the funds
            // Balance checks are being done inside the transfer function
            self.env()
                .transfer(to, value)
                .map_err(|_| Error::TransferFailed)?;

            // emit event
            Self::emit_event(Self::env(), Event::Transfer(Transfer { to, value }));

            Ok(())
        }

        //-------------------------------------------------------
        // Internal functions

        fn ensure_self_call(&self) -> Result<(), Error> {
            if self.env().caller() != self.env().account_id() {
                return Err(Error::Unauthorized);
            }
            Ok(())
        }

        fn ensure_is_owner(&self, owner: AccountId) -> Result<(), Error> {
            self.owners
                .contains(owner)
                .then_some(())
                .ok_or(Error::NotOwner)
        }

        fn ensure_not_already_voted(&self, tx_id: TxId) -> Result<(), Error> {
            if self.approvals.get((tx_id, self.env().caller())).is_some() {
                return Err(Error::AlreadyVoted);
            }
            Ok(())
        }

        fn check_threshold_met(&self, tx_id: TxId) -> bool {
            // Fetch the approvals for the transaction
            let approvals = self.approvals_count.get(tx_id).expect("This should never fail. We are fetching the approvals count for a transaction that we know exists");
            approvals >= self.threshold
        }

        fn check_threshold_can_be_met(&self, tx_id: TxId) -> bool {
            // Fetch the rejections for the transaction
            let rejections  = self.rejections_count.get(tx_id).expect("This should never fail. We are fetching the approvals count for a transaction that we know exists");

            // if the rejections are greater than owners - threshold, then the threshold can't be met
            rejections <= self.owners_list.len() as u8 - self.threshold
        }

        fn perform_approval_rejection_checking(&mut self, tx_id: TxId) -> Result<(), Error> {
            // Check that the caller is an owner
            self.ensure_is_owner(self.env().caller())?;

            // Check that the transaction exists
            self.is_tx_valid(tx_id)?;

            // Check that the caller has not voted yet
            self.ensure_not_already_voted(tx_id)?;

            Ok(())
        }

        fn execute_tx(&mut self, tx_id: TxId) {
            // Fetch the transaction
            let tx = self.get_tx(tx_id).expect("This should never fail because we are checking the tx_id before calling this function");

            let tx_result = build_call::<<Self as ::ink::env::ContractEnv>::Env>()
                .call(tx.address)
                .gas_limit(tx.gas_limit)
                .transferred_value(tx.transferred_value) //TODO: check if we can use the contract balance instead of the transferred value
                .call_flags(CallFlags::default().set_allow_reentry(tx.allow_reentry))
                .exec_input(ExecutionInput::new(tx.selector.into()).push_arg(InputArgs(&tx.input)))
                .returns::<Vec<u8>>()
                .try_invoke();

            ink::env::debug_println!("Result: {:?}", &tx_result);
            // Instead of just returning a custom Error we could return the error from the call
            let result = match tx_result {
                Ok(Ok(bytes)) => TxResult::Success(bytes),
                Ok(Err(e)) => TxResult::Failed(Error::LangExecutionFailed(e)),
                Err(e) => {
                    ink::env::debug_println!("Error: {:?}", &e);
                    let env_error = handle_env_error(e);
                    TxResult::Failed(Error::EnvExecutionFailed(env_error))
                }
            };

            // We need to load the storage again because the call might have changed it.
            // In order to use this we imported the Flush trait from openbrush.
            // Importing openbrush 3.1.0 forced us to downgrade ink to 4.1.0
            // check if it is reentrant for the same contract to perform the loading again
            if tx.allow_reentry && tx.address == self.env().account_id() {
                self.load(); //TODO check if we create some vulnerabilities with this
            }

            // Delete the transaction from the storage
            self.remove_tx(tx_id);

            // Emit event
            Self::emit_event(
                Self::env(),
                Event::TransactionExecuted(TransactionExecuted { tx_id, result }),
            );
        }

        fn remove_tx(&mut self, tx_id: TxId) {
            // Remove the transaction from the index list
            self.txs_id_list.retain(|&x| x != tx_id);

            // Remove the transaction from the mappping
            self.txs.remove(tx_id);

            // Remove the transaction from the approvals count
            self.approvals_count.remove(tx_id);

            // Remove the transaction from the rejections count
            self.rejections_count.remove(tx_id);

            // Remove the approvals TODO: check if there is a more efficient way of doing it
            for owner in self.owners_list.iter() {
                self.approvals.remove((tx_id, *owner));
            }

            // emit event
            Self::emit_event(
                Self::env(),
                Event::TransactionRemoved(TransactionRemoved { tx_id }),
            );
        }

        fn approve(&mut self, tx_id: TxId) -> Result<(), Error> {
            let approvals = self
                .approvals_count
                .get(tx_id)
                .expect("This cannot panic if checks already perfromed");
            self.approvals_count.insert(tx_id, &(approvals + 1));
            self.approvals.insert((tx_id, self.env().caller()), &true);
            Ok(())
        }

        fn reject(&mut self, tx_id: TxId) -> Result<(), Error> {
            let rejections = self
                .rejections_count
                .get(tx_id)
                .expect("This cannot panic if checks already perfromed");
            self.rejections_count.insert(tx_id, &(rejections + 1));
            self.approvals.insert((tx_id, self.env().caller()), &false);
            Ok(())
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
            EE: EmitEvent<MultiSig>,
        {
            emitter.emit_event(event);
        }

        //-------------------------------------------------------
        // Read functions

        // Owners
        #[ink(message)]
        pub fn get_owners(&self) -> Vec<AccountId> {
            self.owners_list.clone()
        }

        #[ink(message)]
        pub fn is_owner(&self, owner: AccountId) -> bool {
            self.owners.contains(owner)
        }

        // Treshold
        #[ink(message)]
        pub fn get_threshold(&self) -> u8 {
            self.threshold
        }

        // Transactions
        #[ink(message)]
        pub fn get_next_tx_id(&self) -> TxId {
            self.next_tx_id
        }

        #[ink(message)]
        pub fn get_active_txid_list(&self) -> Vec<TxId> {
            self.txs_id_list.clone()
        }

        #[ink(message)]
        pub fn get_tx(&self, index: TxId) -> Option<Transaction> {
            self.txs.get(index)
        }

        #[ink(message)]
        pub fn is_tx_valid(&self, tx_id: TxId) -> Result<(), Error> {
            self.txs
                .contains(tx_id)
                .then_some(())
                .ok_or(Error::InvalidTxId)
        }

        #[ink(message)]
        pub fn get_tx_approvals(&self, tx_id: TxId) -> Option<u8> {
            self.approvals_count.get(tx_id)
        }

        #[ink(message)]
        pub fn get_tx_rejections(&self, tx_id: TxId) -> Option<u8> {
            self.rejections_count.get(tx_id)
        }

        #[ink(message)]
        pub fn get_tx_approval_for_account(&self, tx_id: TxId, owner: AccountId) -> Option<bool> {
            self.approvals.get((tx_id, owner))
        }
    }

    // Ensure the params of the constructor are valid
    // according to the rules of the contract
    fn ensure_creation_params(threshold: u8, owners_list: &Vec<AccountId>) -> Result<(), Error> {
        // Check that owners are not empty
        if owners_list.is_empty() {
            return Err(Error::OwnersCantBeEmpty);
        }

        // Check that threshold is not greater than owners
        if threshold > owners_list.len() as u8 {
            return Err(Error::ThresholdGreaterThanOwners);
        }

        // Check that threshold is not zero
        if threshold == 0 {
            return Err(Error::ThresholdCantBeZero);
        }

        Ok(())
    }

    fn handle_env_error(env_error: EnvError) -> WrappedEnvError {
        match env_error {
            EnvError::Decode(_) => WrappedEnvError::Decode,
            EnvError::CalleeTrapped => WrappedEnvError::CalleeTrapped,
            EnvError::CalleeReverted => WrappedEnvError::CalleeReverted,
            EnvError::TransferFailed => WrappedEnvError::TransferFailed,
            EnvError::NotCallable => WrappedEnvError::NotCallable,
            _ => WrappedEnvError::Unexpected,
        }
    }
}
