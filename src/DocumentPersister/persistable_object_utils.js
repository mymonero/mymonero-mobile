import uuidV1 from 'uuid/v1'
import string_cryptor from '../symmetric_cryptor/symmetric_string_cryptor'

function read (
  persister, // DocumentPersister.SecureStorage
  CollectionName,
  persistableObject, // you must set ._id on this before call
  fn // (err?, plaintextDocument?)
) {
  const self = persistableObject
  persister.DocumentsWithIds(
    CollectionName,
    [self._id],
    function (err, docs) {
      if (err) {
        console.error(err.toString())
        fn(err)
        return
      }
      if (docs.length === 0) {
        const errStr = '❌  Record with that _id not found.'
        const err = new Error(errStr)
        console.error(errStr)
        fn(err)
        return
      }
      const encryptedDocument = docs[0]
      if (encryptedDocument.value !== undefined) {
        __proceedTo_decryptEncryptedDocument(encryptedDocument.value)
      } else {
        __proceedTo_decryptEncryptedDocument(encryptedDocument)
      }
    }
  )

  function __proceedTo_decryptEncryptedDocument (encryptedBase64String) {
    string_cryptor.New_DecryptedString__Async(
      encryptedBase64String,
      self.persistencePassword,
      function (err, plaintextString) {
        if (err) {
          console.error('❌  Decryption err: ' + err.toString())
          fn(err)
          return
        }
        let plaintextDocument
        if (typeof(plaintextString) === 'string') { // we're going to add an else case to try address a bug that cropped up in release 1.2.6
          try {
            plaintextDocument = JSON.parse(plaintextString)
            fn(null, plaintextDocument)
          } catch (e) {
            const errStr = 'Error while parsing JSON: ' + e + " while parsing " + self.CollectionName
            console.error('❌  ' + errStr)
            fn(errStr)
            return
          }
        } else { // this else is an attempt to address a JSON.parse bug that can't be replicated on our side
          try {
            plaintextDocument = plaintextString
            fn(null, plaintextDocument)
          } catch (e) {
            console.error('❌  Error while decrypting - non-string passed to encryptedBase64String')
          }
        }
      }
    )
  }
}
//
function write (
  persister,
  persistableObject, // for reading and writing the _id
  CollectionName,
  plaintextDocument,
  persistencePassword,
  fn, 
  migrateFromIOS = false
) {
  const self = persistableObject
  let _id = plaintextDocument._id
  if (typeof _id === 'undefined' || _id == null || _id == '') {
    _id = uuidV1()
    plaintextDocument._id = _id
  }
  const plaintextJSONString = JSON.stringify(plaintextDocument)

  string_cryptor.New_EncryptedBase64String__Async(
    plaintextJSONString,
    persistencePassword,
    function (err, encryptedBase64String) {
      if (err) {
        console.error('Error while saving :', err)
        fn(err)
        return
      }
      if (self._id === null || migrateFromIOS === true) {
        _proceedTo_insertNewDocument(encryptedBase64String)
      } else {
        // sucessfully decrypted document
        _proceedTo_updateExistingDocument(encryptedBase64String)
      }
    }
  )
  function _proceedTo_insertNewDocument (encryptedBase64String) {
    persister.InsertDocument(
      CollectionName,
      plaintextDocument._id,
      encryptedBase64String,
      function (err) {
        if (err) {
          console.error('Error while saving object:', err)
          fn(err)
          return
        }
        self._id = plaintextDocument._id // so we have it in runtime memory now…
        // Saved newly inserted object
        fn()
      }
    )
  }
  function _proceedTo_updateExistingDocument (encryptedBase64String) {
    persister.UpdateDocumentWithId(
      CollectionName,
      self._id,
      encryptedBase64String,
      function (err) {
        if (err) {
          console.error('Error while saving record:', err)
          fn(err)
          return
        }
        // console.log('✅  Saved update to object with _id ' + self._id + '.')
        fn()
      }
    )
  }
}
export default { read, write }
