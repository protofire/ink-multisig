//! # Multisig contract
//! This contract allows to create a multisig wallet.
//!
//! ## Overview
//!
//! The contract allows to create a multisig wallet with a list of owners and a threshold.
//! The threshold is the minimum number of approvals required to execute a transaction.
//! In order to be transparent it does not require off-chain signs and everything is being done on-chain.
//!
//! ## DISCLAIMER
//!
//! This contract is not audited and should not be used in production. Use it under your own risk.
//!

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
        prelude::{format, string::String, vec::Vec},
        storage::Mapping,
    };
    use openbrush::traits::Flush;
    use scale::Output;

    // Defined the types used in the contract
    /// TxId is the type used to identify a transaction in the contract
    type TxId = u128;
    /// Approvals is the type used to count the number of approvals for a transaction
    type Approvals = u8;
    /// Rejections is the type used to count the number of rejections for a transaction
    type Rejections = u8;

    /// Define the constants used in the contract this constants may change depending
    /// on the kind of usage of the contract
    /// MAX_OWNERS is the maximum number of owners that can be added to the contract
    /// MAX_TRANSACTIONS is the maximum number of transactions that can be active at the same time
    const MAX_OWNERS: u8 = 10;
    const MAX_TRANSACTIONS: u8 = 10;

    /// Struct to SCALE encode the input of the call
    struct InputArgs<'a>(&'a [u8]);

    /// Implementation of the SCALE encoding for the InputArgs struct
    impl<'a> scale::Encode for InputArgs<'a> {
        fn encode_to<T: Output + ?Sized>(&self, dest: &mut T) {
            dest.write(self.0);
        }
    }

    /// Define the events that will be emitted by the contract to be distinguished from the
    /// events defined in the factory contract
    type Event = <MultiSig as ink::reflect::ContractEventBase>::Type;

    /// Emitted when the threshold is changed
    #[ink(event)]
    pub struct ThresholdChanged {
        /// The new threshold
        #[ink(topic)]
        threshold: u8,
    }

    /// Emmited when an owner is added
    #[ink(event)]
    pub struct OwnerAdded {
        /// New owner's account id
        #[ink(topic)]
        owner: AccountId,
    }

    /// Emmited when an owner is removed
    #[ink(event)]
    pub struct OwnerRemoved {
        /// Removed owner's account id
        #[ink(topic)]
        owner: AccountId,
    }

    /// Emmited when a transaction is proposed
    #[ink(event)]
    pub struct TransactionProposed {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
        /// Contract address
        #[ink(topic)]
        contract_address: AccountId,
        /// Selector on the contract
        selector: [u8; 4],
        /// Input of the call
        input: Vec<u8>,
        /// Transferred value of the call
        transferred_value: Balance,
        /// Gas limit of the call
        gas_limit: u64,
        /// Allow reentry flag of the call
        allow_reentry: bool,
    }

    /// Emmited when a transaction is approved
    #[ink(event)]
    pub struct Approve {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
        /// approver's account id
        #[ink(topic)]
        owner: AccountId,
    }

    /// Emmited when a transaction is rejected
    #[ink(event)]
    pub struct Reject {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
        /// rejecter's account id
        #[ink(topic)]
        owner: AccountId,
    }

    /// Emmited when a transaction is executed
    #[ink(event)]
    pub struct TransactionExecuted {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
        /// Result of the transaction execution
        result: TxResult,
    }

    /// Emmited when a transaction is cancelled
    #[ink(event)]
    pub struct TransactionCancelled {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
    }

    /// Emmited when a transaction is removed
    #[ink(event)]
    pub struct TransactionRemoved {
        /// Transaction id
        #[ink(topic)]
        tx_id: TxId,
    }

    /// Emmited when a transfer is performed
    #[ink(event)]
    pub struct Transfer {
        /// Receiver's account id
        #[ink(topic)]
        to: AccountId,
        /// Amount of the transfer
        value: Balance,
    }

    /// Transaction result information that has either a success or a failure
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum TxResult {
        /// Transaction executed successfully with the given result
        Success(Vec<u8>),
        /// Transaction failed with the given error
        Failed(Error),
    }

    /// Error types that can be returned by the contract
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Env error encountered when executing the transaction
        EnvExecutionFailed(String),
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

    impl From<EnvError> for Error {
        fn from(e: EnvError) -> Self {
            Error::EnvExecutionFailed(format!("{:?}", e))
        }
    }

    /// Structure that represents a transaction to be performed when the threshold is reached
    #[derive(scale::Decode, scale::Encode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Transaction {
        /// Address of the contract to be called
        pub address: AccountId,
        /// Selector of the function to be called
        pub selector: [u8; 4],
        /// Input of the function to be called
        pub input: Vec<u8>,
        /// Transferred value of the call
        pub transferred_value: Balance,
        /// Gas limit of the call
        pub gas_limit: u64,
        /// Allow reentry flag of the call
        pub allow_reentry: bool,
    }

    /// Structure that represents the multisig contract
    /// It contains the list of owners, the threshold, the list of transactions and the list of approvals
    /// The presence of redundant information between owners_list and owners, and transactions_id_list and transactions
    /// is intentional to make it easier the elements access.
    /// Although they represent the same TxId, this redundancy is maintained in order to support efficient iteration over
    /// 'transactions_id_list' while fetching a transaction. By duplicating the tx IDs, we achieve a constant time complexity of
    /// O(1) when accessing tx information directly from 'transacctions'.
    #[ink(storage)]
    #[derive(Default)]
    pub struct MultiSig {
        /// List of owners of the multisig contract
        /// Owners are account ids that can propose, approve or reject transactions
        owners_list: Vec<AccountId>,
        /// Mapping of owners to check if an account id is an owner
        owners: Mapping<AccountId, ()>,
        /// Threshold of approvals required to execute a transaction
        threshold: u8,
        /// Next transaction id to be used (just a counter)
        next_tx_id: TxId,
        /// List of transactions that have been proposed
        txs_id_list: Vec<TxId>,
        /// Mapping of transactions to fetch a transaction by its id
        txs: Mapping<TxId, Transaction>,
        /// Mapping of approvals to check which owner has approved or rejected a transaction
        approvals: Mapping<(TxId, AccountId), bool>,
        /// Mapping of approvals count to check how many approvals a transaction has
        approvals_count: Mapping<TxId, Approvals>,
        /// Mapping of rejections count to check how many rejections a transaction has
        rejections_count: Mapping<TxId, Rejections>,
    }

    impl MultiSig {
        /// Constructor that creates a multisig contract with a list of owners and a threshold
        /// The threshold is the minimum number of approvals required to execute a transaction
        /// All the representation invariant checks are performed in the constructor
        /// The list of owners is a list of account ids that can propose, approve or reject transactions
        /// The list of owners cannot be empty
        /// The owners cannot be duplicated
        /// The threshold cannot be greater than the number of owners
        /// The threshold cannot be zero
        /// The maximum number of owners is defined by MAX_OWNERS
        /// The maximum number of transactions is defined by MAX_TRANSACTIONS
        /// The transaction Id is a counter that starts at 0 and is incremented by 1 for each transaction
        /// The transaction Id cannot overflow
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

        /// Transaction proposal
        /// The parameters of the transaction are passed as a Transaction struct
        /// The caller of this function must be an owner
        /// The maximum number of transactions cannot be passed
        /// The transaction Id cannot overflow
        /// The transaction is stored in the contract
        /// The transaction is initialized with 1 approval and 0 rejections
        /// Emit TransactionProposed event
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
            self._try_execute_tx(current_tx_id);

            Ok(())
        }

        /// Transaction approval
        /// The caller of this function must be an owner
        /// The parameter of the transaction is the transaction Id
        /// The transaction Id must be valid
        /// The caller must not have voted yet
        /// The transaction is approved
        /// Emit Approve event
        /// The transaction is executed if the threshold is met
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

            self._try_execute_tx(tx_id);
            Ok(())
        }

        /// Transaction rejection
        /// The caller of this function must be an owner
        /// The parameter of the transaction is the transaction Id
        /// The transaction Id must be valid
        /// The caller must not have voted yet
        /// The transaction is rejected
        /// Emit Reject event
        /// The transaction is removed if the threshold cannot be met with the remaining approvals
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

            self._try_remove_tx(tx_id);
            Ok(())
        }

        /// Transaction execution
        /// The transaction Id must be valid
        /// The parameter of the transaction is the transaction Id
        /// The threshold must be met in order to execute the transaction
        #[ink(message)]
        pub fn try_execute_tx(&mut self, tx_id: TxId) -> Result<(), Error> {
            self.is_tx_valid(tx_id)?;
            self._try_execute_tx(tx_id);
            Ok(())
        }

        /// Transaction removal
        /// The transaction Id must be valid
        /// The parameter of the transaction is the transaction Id
        /// The threshold must not be met in order to remove the transaction
        #[ink(message)]
        pub fn try_remove_tx(&mut self, tx_id: TxId) -> Result<(), Error> {
            self.is_tx_valid(tx_id)?;
            self._try_remove_tx(tx_id);
            Ok(())
        }

        // Owner management
        /// Owner addition
        /// The caller of this function must be the multisig contract itself
        /// The parameter of the transaction is the owner's account id
        /// Perform checking representation invariants
        /// The maximum number of owners cannot be reached
        /// The owner cannot be already an owner
        /// The owner is added
        /// Emit OwnerAdded event
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

        /// Owner removal
        /// The caller of this function must be the multisig contract itself
        /// The parameter of the transaction is the owner's account id
        /// Perform checking representation invariants
        /// The owners cannot be empty after removing
        /// The threshold cannot be greater than the number of owners after removing
        /// The owner is removed
        /// Emit OwnerRemoved event
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

        /// Threshold change
        /// The caller of this function must be the multisig contract itself
        /// The parameter of the transaction is the new threshold
        /// Perform checking representation invariants
        /// The threshold cannot be greater than the number of owners
        /// The threshold cannot be zero
        /// The threshold is changed
        /// Emit ThresholdChanged event
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

        /// Transfer funds from the contract to another account
        /// The caller of this function must be the multisig contract itself
        /// The parameter of the transaction is the receiver's account id and the amount to be transferred
        /// The transfer is performed
        /// Emit Transfer event
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
        //-------------------------------------------------------

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

        fn _try_execute_tx(&mut self, tx_id: TxId) {
            // check threshold met
            if self.check_threshold_met(tx_id) {
                // execute transaction
                self.execute_tx(tx_id);
            }
        }

        fn execute_tx(&mut self, tx_id: TxId) {
            // Fetch the transaction
            let tx = self.get_tx(tx_id).expect("This should never fail because we are checking the tx_id before calling this function");

            let tx_result = build_call::<<Self as ::ink::env::ContractEnv>::Env>()
                .call(tx.address)
                .gas_limit(tx.gas_limit)
                .transferred_value(tx.transferred_value)
                .call_flags(CallFlags::default().set_allow_reentry(tx.allow_reentry))
                .exec_input(ExecutionInput::new(tx.selector.into()).push_arg(InputArgs(&tx.input)))
                .returns::<Vec<u8>>()
                .try_invoke();

            // Instead of just returning a custom Error we could return the error from the call
            let result = match tx_result {
                Ok(Ok(bytes)) => TxResult::Success(bytes),
                Ok(Err(e)) => TxResult::Failed(Error::LangExecutionFailed(e)),
                Err(e) => TxResult::Failed(Error::from(e)),
            };

            // We need to load the storage again because the call might have changed it.
            // In order to use this we imported the Flush trait from openbrush.
            // Importing openbrush 3.1.0 forced us to downgrade ink to 4.1.0
            // check if it is reentrant for the same contract to perform the loading again
            if tx.allow_reentry && tx.address == self.env().account_id() {
                self.load();
            }

            // Delete the transaction from the storage
            self.remove_tx(tx_id);

            // Emit event
            Self::emit_event(
                Self::env(),
                Event::TransactionExecuted(TransactionExecuted { tx_id, result }),
            );
        }

        fn _try_remove_tx(&mut self, tx_id: TxId) {
            // check if threshold can be met with the remaining approvals
            if !self.check_threshold_can_be_met(tx_id) {
                Self::emit_event(
                    Self::env(),
                    Event::TransactionCancelled(TransactionCancelled { tx_id }),
                );

                // delete transaction
                self.remove_tx(tx_id);
            }
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
        //-------------------------------------------------------

        /// Owners
        /// Get Owners
        /// The owners list is a list of account ids that can propose, approve or reject transactions
        #[ink(message)]
        pub fn get_owners(&self) -> Vec<AccountId> {
            self.owners_list.clone()
        }

        /// Is owner
        /// The parameter of the transaction is the owner's account id
        /// The owner is checked if it is an owner
        #[ink(message)]
        pub fn is_owner(&self, owner: AccountId) -> bool {
            self.owners.contains(owner)
        }

        /// Treshold
        /// Get Threshold
        /// The threshold is the current minimum number of approvals required to execute a transaction
        #[ink(message)]
        pub fn get_threshold(&self) -> u8 {
            self.threshold
        }

        /// Transactions
        /// Get Next Transaction Id
        /// Returns the next transaction id
        #[ink(message)]
        pub fn get_next_tx_id(&self) -> TxId {
            self.next_tx_id
        }

        /// Get Active Transactions Id List
        /// Returns the list of active transactions
        #[ink(message)]
        pub fn get_active_txid_list(&self) -> Vec<TxId> {
            self.txs_id_list.clone()
        }

        /// Get Transaction
        /// The parameter of the transaction is the transaction id
        /// Returns the transaction or None if the transaction id is not valid
        #[ink(message)]
        pub fn get_tx(&self, index: TxId) -> Option<Transaction> {
            self.txs.get(index)
        }

        /// Is Transaction Valid
        /// The parameter of the transaction is the transaction id
        /// Returns a result with () if the transaction id is valid or an Error if it is not valid
        #[ink(message)]
        pub fn is_tx_valid(&self, tx_id: TxId) -> Result<(), Error> {
            self.txs
                .contains(tx_id)
                .then_some(())
                .ok_or(Error::InvalidTxId)
        }

        /// Get Transaction Approvals
        /// The parameter of the transaction is the transaction id
        /// Returns the number of approvals for the transaction if the transaction id is valid or None if it is not valid
        #[ink(message)]
        pub fn get_tx_approvals(&self, tx_id: TxId) -> Option<u8> {
            self.approvals_count.get(tx_id)
        }

        /// Get Transaction Rejections
        /// The parameter of the transaction is the transaction id
        /// Returns the number of rejections for the transaction if the transaction id is valid or None if it is not valid
        #[ink(message)]
        pub fn get_tx_rejections(&self, tx_id: TxId) -> Option<u8> {
            self.rejections_count.get(tx_id)
        }

        /// Get Transaction Approval For Account
        /// The parameters of the transaction are the transaction id and the account id
        /// Returns true if the account has approved the transaction, false if the account has rejected the transaction or None if the transaction id is not valid
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
}
