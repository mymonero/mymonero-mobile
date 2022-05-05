'use strict'

import ListBaseController from '../../Lists/Controllers/ListBaseController'
import Contact from '../Models/Contact'
import contact_persistence_utils from '../Models/contact_persistence_utils'

class ContactsListController extends ListBaseController {
  constructor (options, context) {
    super(options, context)
    self.deleteEverythingRegistrants = {}
    self.changePasswordRegistrants = {}
  }

  //
  //
  // Overrides
  //
  override_CollectionName () {
    return contact_persistence_utils.CollectionName
  }

  override_lookup_RecordClass () {
    return Contact
  }

  override_booting_reconstituteRecordInstanceOptionsWithBase (
    optionsBase, // _id is already supplied in this
    persistencePassword,
    forOverrider_instance_didBoot_fn,
    forOverrider_instance_didFailBoot_fn
  ) {

    const self = this
    optionsBase.persistencePassword = persistencePassword
    //
    // now supply actual callbacks
    optionsBase.failedToInitialize_cb = function (err, returnedInstance) {
      console.error('Failed to initialize contact ', err, returnedInstance)
      // we're not going to pass this err through though because it will prevent booting... we mark the instance as 'errored'
      forOverrider_instance_didBoot_fn(err, returnedInstance)
    }
    optionsBase.successfullyInitialized_cb = function (returnedInstance) {
      forOverrider_instance_didBoot_fn(null, returnedInstance) // no err
    }
  }

  overridable_finalizeAndSortRecords (fn) // () -> Void; we must call this!
  {
    const self = this
    // do not call on `super` of fn could be called redundantly
    self.records = self.records.sort(
      function (a, b) {
        if (!a.fullname) {
          if (b.fullname) {
            return 1
          }
          return -1
        } else if (!b.fullname) {
          return -1
        }
        return a.fullname.localeCompare(b.fullname) // to get unicode support
      }
    )
    fn() // ListBaseController overriders must call this!
  }

  overridable_shouldSortOnEveryRecordAdditionAtRuntime () {
    return true
  }

  //
  //
  // Public - Runtime - State - Emoji
  //
  GivenBooted_CurrentlyInUseEmojis () {
    const self = this
    const inUseEmojis = [] // opting for 's' here else it's ambiguous
    {
      self.records.forEach(
        function (record, i) {
          const emoji = record.emoji
          if (typeof emoji !== 'undefined' && emoji) {
            inUseEmojis.push(emoji)
          }
        }
      )
    }
    return inUseEmojis
  }

  //
  //
  // Booted - Imperatives - Public - List management
  //
  WhenBooted_AddContact (
    valuesByKey,
    fn // (err: Error?, instance: Contact?) -> Void
  ) {
    const self = this
    const context = self.context
    self.ExecuteWhenBooted(
      function () { // ^- this may block until we have the pw, depending on if there are records to load on boot
        // console.log('ContactsListController: WhenBooted_AddContact -- first loop')
        self.context.passwordController.WhenBootedAndPasswordObtained_PasswordAndType( // this will block until we have access to the pw
          function (obtainedPasswordString, userSelectedTypeOfPassword) {
            // console.log('ContactsListController: WhenBooted_AddContact -- password loop')
            const options = valuesByKey || {}
            options.persistencePassword = obtainedPasswordString
            options.failedToInitialize_cb = function (err, contactInstance) {
              // console.log('ContactsListController: WhenBooted_AddContact -- unsucessfully initialised')
              console.error('Failed to add contact ', err, contactInstance)
              fn(err)
            }
            options.successfullyInitialized_cb = function (contactInstance) {
              // console.log('ContactsListController: WhenBooted_AddContact -- sucessfully initialised')
              self._atRuntime__record_wasSuccessfullySetUpAfterBeingAdded(contactInstance)
              fn(null, contactInstance)
            }
            const instance = new Contact(options, context)
          }
        )
      }
    )
  }

  AddRegistrantForDeleteEverything (registrant) {
    const self = this
    // console.log("Adding registrant for 'DeleteEverything': ", registrant.constructor.name)
    const token = uuidV1()
    self.deleteEverythingRegistrants[token] = registrant
    return token
  }

  AddRegistrantForChangePassword (registrant) {
    const self = this
    // console.log("Adding registrant for 'ChangePassword': ", registrant.constructor.name)
    const token = uuidV1()
    self.changePasswordRegistrants[token] = registrant
    return token
  }

  RemoveRegistrantForDeleteEverything (registrant) {
    const self = this
    // console.log("Removing registrant for 'DeleteEverything': ", registrant.constructor.name)
    delete self.deleteEverythingRegistrants[token]
  }

  RemoveRegistrantForChangePassword (registrant) {
    const self = this
    // console.log("Removing registrant for 'ChangePassword': ", registrant.constructor.name)
    delete self.changePasswordRegistrants[token]
  }

  override_CollectionName () {
    return 'Contacts'
  }
}
export default ContactsListController
