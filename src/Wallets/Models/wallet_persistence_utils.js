import persistable_object_utils from '../../DocumentPersister/persistable_object_utils'

import { BigInteger as JSBigInt } from '@mymonero/mymonero-bigint'

const CollectionName = 'Wallets'
// console.log("Wallet persistence loaded")
//
// Utility functions
function HydrateInstance (
  walletInstance,
  plaintextDocument
) {
  const self = walletInstance
  
  // for yat persistence
  if (plaintextDocument.eid !== 'undefined') {
    self.eid = plaintextDocument.eid
  }

  self.isLoggedIn = plaintextDocument.isLoggedIn
  self.isInViewOnlyMode = plaintextDocument.isInViewOnlyMode

  self.login__new_address = plaintextDocument.login__new_address // may be undefined
  self.login__generated_locally = plaintextDocument.login__generated_locally // may be undefined
  if (typeof plaintextDocument.local_wasAGeneratedWallet !== 'undefined') {
    self.local_wasAGeneratedWallet = plaintextDocument.local_wasAGeneratedWallet
  }
  function _isNonNil_dateStr (v) { return v != null && typeof v !== 'undefined' && v !== '' }
  {
    const dateStr = plaintextDocument.dateThatLast_fetchedAccountInfo
    self.dateThatLast_fetchedAccountInfo = _isNonNil_dateStr(dateStr) ? new Date(dateStr) : null
  }
  {
    const dateStr = plaintextDocument.dateThatLast_fetchedAccountTransactions
    self.dateThatLast_fetchedAccountTransactions = _isNonNil_dateStr(dateStr) ? new Date(dateStr) : null
  }
  {
    const dateStr = plaintextDocument.dateWalletFirstSavedLocally
    self.dateWalletFirstSavedLocally = _isNonNil_dateStr(dateStr) ? new Date(dateStr) : null
  }
  //
  self.walletLabel = plaintextDocument.walletLabel
  self.wallet_currency = plaintextDocument.wallet_currency
  self.swatch = plaintextDocument.swatch
  //
  // console.log("plaintextDocument", plaintextDocument)
  self.mnemonic_wordsetName = plaintextDocument.mnemonic_wordsetName
  self.account_seed = plaintextDocument.account_seed !== '' ? plaintextDocument.account_seed : null // do not ever want to have empty string
  self.private_keys = plaintextDocument.private_keys
  self.public_address = plaintextDocument.public_address
  self.public_keys = plaintextDocument.public_keys
  self.isInViewOnlyMode = plaintextDocument.isInViewOnlyMode
  //
  self.transactions = plaintextDocument.transactions
  self.transactions.forEach(
    function (tx, i) { // we must fix up what JSON stringifying did to the data
      tx.timestamp = new Date(tx.timestamp)
      // the following has both parsing from string (correct) and migration from (incorrect) previous JSON serializations of the bigint obj from pre 1.1.0 rc3
      {
        const val = tx.total_sent
        if (val != '' && val != null && typeof val !== 'undefined') {
          if (typeof val === 'string') {
            tx.total_sent = new JSBigInt(val)
          } else if (typeof val === 'object') {
            if (typeof val._d === 'undefined' || val._d == null ||
							typeof val._s === 'undefined' || val._s == null) {
              throw "Couldn't parse saved tx.total_sent: " + val
            }
            tx.total_sent = new JSBigInt(val._d, val._s, JSBigInt.CONSTRUCT)
          } else {
            throw "Couldn't parse saved tx.total_sent: " + tx.total_sent
          }
        } else {
          tx.total_sent = new JSBigInt(0)
        }
      }
      {
        const val = tx.total_received
        if (val != '' && val != null && typeof val !== 'undefined') {
          if (typeof val === 'string') {
            tx.total_received = new JSBigInt(val)
          } else if (typeof val === 'object') {
            if (typeof val._d === 'undefined' || val._d == null ||
							typeof val._s === 'undefined' || val._s == null) {
              throw "Couldn't parse saved tx.total_sent: " + val
            }
            tx.total_received = new JSBigInt(val._d, val._s, JSBigInt.CONSTRUCT)
          } else {
            throw "Couldn't parse saved tx.total_sent: " + tx.total_sent
          }
        } else {
          tx.total_received = new JSBigInt(0)
        }
      }
    }
  )
  //
  // unpacking heights…
  // with the iOS migration, an imported wallet will fail because it stores height information differently
  if (typeof(plaintextDocument.heights) !== 'undefined') {
    const heights = plaintextDocument.heights // no || {} because we always persist at least {}
    const totals = plaintextDocument.totals
    self.account_scanned_height = heights.account_scanned_height
    self.account_scanned_tx_height = heights.account_scanned_tx_height
    self.account_scanned_block_height = heights.account_scanned_block_height
    self.account_scan_start_height = heights.account_scan_start_height
    self.transaction_height = heights.transaction_height
    self.blockchain_height = heights.blockchain_height
    self.total_received = new JSBigInt(totals.total_received) // persisted as string
    self.locked_balance = new JSBigInt(totals.locked_balance) // persisted as string
    self.total_sent = new JSBigInt(totals.total_sent) // persisted as string
  } else {
    // ios migrated wallet mapping -- DO NOT REMOVE
    self.account_scanned_height = plaintextDocument.account_scanned_height
    self.account_scanned_tx_height = plaintextDocument.account_scanned_tx_height
    self.account_scanned_block_height = plaintextDocument.account_scanned_block_height
    self.account_scan_start_height = plaintextDocument.account_scan_start_height
    self.transaction_height = plaintextDocument.transaction_height
    self.blockchain_height = plaintextDocument.blockchain_height  
    self.total_received = new JSBigInt(plaintextDocument.total_received) // persisted as string
    self.locked_balance = new JSBigInt(plaintextDocument.locked_balance) // persisted as string
    self.total_sent = new JSBigInt(plaintextDocument.total_sent) // persisted as string
    self.wallet_currency = plaintextDocument.currency
    self.public_address = plaintextDocument.publicAddress
    self.public_keys = plaintextDocument.publicKeys
    self.swatch = plaintextDocument.swatchColorHexString
    self.private_keys = plaintextDocument.privateKeys
    // self.totals = {
    //   locked_balance: "0",
    //   total_received: "1000000",
    //   total_sent: "0"
    // }
  }
  // unpacking totals -- these are stored as strings
  //
  self.spent_outputs = plaintextDocument.spent_outputs // no || [] because we always persist at least []
}
//
//
function SaveToDisk (
  walletInstance,
  fn
) {
  const self = walletInstance
  // console.log('📝  Saving wallet to disk ', self.Description())
  //
  const persistencePassword = self.persistencePassword
  if (persistencePassword === null || typeof persistencePassword === 'undefined' || persistencePassword === '') {
    const errStr = '❌  Cannot save wallet to disk as persistencePassword was missing.'
    const err = new Error(errStr)
    fn(err)
    return
  }
  //
  const heights = {} // to construct:
  if (self.account_scanned_tx_height !== null && typeof self.account_scanned_tx_height !== 'undefined') {
    heights.account_scanned_tx_height = self.account_scanned_tx_height
  }
  if (self.account_scanned_height !== null && typeof self.account_scanned_height !== 'undefined') {
    heights.account_scanned_height = self.account_scanned_height
  }
  if (self.account_scanned_block_height !== null && typeof self.account_scanned_block_height !== 'undefined') {
    heights.account_scanned_block_height = self.account_scanned_block_height
  }
  if (self.account_scan_start_height !== null && typeof self.account_scan_start_height !== 'undefined') {
    heights.account_scan_start_height = self.account_scan_start_height
  }
  if (self.transaction_height !== null && typeof self.transaction_height !== 'undefined') {
    heights.transaction_height = self.transaction_height
  }
  if (self.blockchain_height !== null && typeof self.blockchain_height !== 'undefined') {
    heights.blockchain_height = self.blockchain_height
  }
  //
  const totals = {} // we store all of these as strings since the totals are JSBigInts
  if (self.total_received !== null && typeof self.total_received !== 'undefined') {
    totals.total_received = self.total_received.toString()
  }
  if (self.locked_balance !== null && typeof self.locked_balance !== 'undefined') {
    totals.locked_balance = self.locked_balance.toString()
  }
  if (self.total_sent !== null && typeof self.total_sent !== 'undefined') {
    totals.total_sent = self.total_sent.toString()
  }
  //
  if (typeof self.dateWalletFirstSavedLocally === 'undefined' || self.dateWalletFirstSavedLocally === null) {
    self.dateWalletFirstSavedLocally = new Date()
  }
  //
  const transactions = self.transactions || []
  transactions.forEach(
    function (tx, i) {
      tx.total_sent = tx.total_sent.toString()
      tx.total_received = tx.total_received.toString()
    }
  )
  //
  const plaintextDocument =
	{
	  walletLabel: self.walletLabel,
	  wallet_currency: self.wallet_currency,
	  swatch: self.swatch,
	  mnemonic_wordsetName: self.mnemonic_wordsetName,
	  //
	  account_seed: self.account_seed,
	  private_keys: self.private_keys,
	  public_address: self.public_address,
	  public_keys: self.public_keys,
	  //
	  isLoggedIn: self.isLoggedIn,
	  dateThatLast_fetchedAccountInfo: self.dateThatLast_fetchedAccountInfo ? self.dateThatLast_fetchedAccountInfo.toString() : undefined, // must convert to string else will get exception on encryption
	  dateThatLast_fetchedAccountTransactions: self.dateThatLast_fetchedAccountTransactions ? self.dateThatLast_fetchedAccountTransactions.toString() : undefined, // must convert to string else will get exception on encryption
	  dateWalletFirstSavedLocally: self.dateWalletFirstSavedLocally ? self.dateWalletFirstSavedLocally.toString() : undefined, // must convert to string else will get exception on encryption
	  //
	  isInViewOnlyMode: self.isInViewOnlyMode,
	  //
	  transactions: transactions,
	  heights: heights,
	  totals: totals,
    spent_outputs: self.spent_outputs || [], // maybe not fetched yet
    eid: self.eid // Optional Yat info
	}

  if (typeof self.login__new_address !== 'undefined') {
    plaintextDocument.login__new_address = self.login__new_address
  }
  if (typeof self.login__generated_locally !== 'undefined') {
    plaintextDocument.login__generated_locally = self.login__generated_locally
  }
  if (typeof self.local_wasAGeneratedWallet !== 'undefined') { // saving this primarily so that we can keep calling the regen function with this value
    plaintextDocument.local_wasAGeneratedWallet = self.local_wasAGeneratedWallet
  }

  persistable_object_utils.write(
    self.context.persister,
    self, // for reading and writing the _id
    CollectionName,
    plaintextDocument, // _id will get generated for this if self does not have an _id
    persistencePassword,
    fn
  )
}
//
function DeleteFromDisk (
  instance,
  fn
) {
  const self = instance
  // console.log('📝  Deleting wallet ', self.Description())
  self.context.persister.RemoveDocumentsWithIds(
    CollectionName,
    [self._id],
    function (
      err,
      numRemoved
    ) {
      // console.log("Invoked removeDocumentsWithIds");
      if (err) {
        console.error('Error while removing wallet:', err)
        fn(err)
        return
      }
      if (numRemoved === 0) {
        fn(new Error("❌  Number of documents removed by _id'd remove was 0"))
        return // bail
      }
      console.log('🗑  Deleted saved wallet with _id ' + self._id + '.')
      fn()
    }
  )
}

export default { CollectionName, HydrateInstance, SaveToDisk, DeleteFromDisk }
