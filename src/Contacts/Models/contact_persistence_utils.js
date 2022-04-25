import persistable_object_utils from '../../DocumentPersister/persistable_object_utils'

//
// Constants
const CollectionName = 'Contacts'
//
// Utility functions
function HydrateInstance (
  instance,
  plaintextDocument
) {
  const self = instance
  //
  // console.log("plaintextDocument", plaintextDocument)
  self.fullname = plaintextDocument.fullname
  self.address = plaintextDocument.address
  self.payment_id = plaintextDocument.payment_id
  self.emoji = plaintextDocument.emoji
  self.cached_OAResolved_XMR_address = plaintextDocument.cached_OAResolved_XMR_address
}
//
function SaveToDisk (
  instance,
  fn
) {
  const self = instance
  // console.log("📝  Saving contact to disk ", self.Description())
  //
  fn = fn || function (err) { console.error(err); console.trace('No fn provided to SaveToDisk') }
  //
  const persistencePassword = self.persistencePassword
  if (persistencePassword === null || typeof persistencePassword === 'undefined' || persistencePassword === '') {
    const errStr = '❌  Cannot save contact to disk as persistencePassword was missing.'
    const err = new Error(errStr)
    fn(err)
    return
  }
  //
  const plaintextDocument =
	{
	  fullname: self.fullname,
	  address: self.address,
	  payment_id: self.payment_id,
	  emoji: self.emoji,
	  cached_OAResolved_XMR_address: self.cached_OAResolved_XMR_address
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
  // console.log('📝  Deleting contact ', self.Description())
  self.context.persister.RemoveDocumentsWithIds(
    CollectionName,
    [self._id],
    function (
      err,
      numRemoved
    ) {
      if (err) {
        console.error('Error while removing contact:', err)
        fn(err)
        return
      }
      if (numRemoved === 0) {
        fn(new Error("❌  Number of documents removed by _id'd remove was 0"))
        return // bail
      }
      // console.log('🗑  Deleted saved contact with _id ' + self._id + '.')
      fn()
    }
  )
}
export default { CollectionName, HydrateInstance, SaveToDisk, DeleteFromDisk }
