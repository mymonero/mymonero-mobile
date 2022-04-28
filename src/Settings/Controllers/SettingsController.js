'use strict'

import EventEmitter from 'events'
import uuidV1 from 'uuid/v1'
import Currencies from '../../CcyConversionRates/Currencies'
import iOSMigrationController from '../../DocumentPersister/iOSMigrationController'

const CollectionName = 'Settings'

const k_defaults_record =
{
  specificAPIAddressURLAuthority: 'https://api.mymonero.com',
  appTimeoutAfterS: 6 * 60, // 6 mins
  invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount: false,
  displayCcySymbol: Currencies.ccySymbolsByCcy.XMR, // default
  authentication_requireWhenSending: true,
  authentication_requireWhenDisclosingWalletSecrets: true,
  autoDownloadUpdatesEnabled: true
}

class SettingsController extends EventEmitter {
  constructor (options, context) {
    super()
    // ^--- have to call super before can access `this`
    //
    const self = this
    self.options = options
    self.context = context
    //
    self.setMaxListeners(999) // avoid error
    //
    self.hasBooted = false
    self._whenBooted_fns = []
    self.password = undefined // it's not been obtained from the user yet - we only store it in memory
    //
    // TODO: implement stopObserving_passwordController
    self.registrantForDeleteEverything_token = self.context.passwordController.AddRegistrantForDeleteEverything(self)
    self.registrantForChangePassword_token = self.context.passwordController.AddRegistrantForChangePassword(self)
    //

    self._tryToBoot()
  }

  async _tryToBoot () {	// we can afford to do this w/o any callback saying "success" because we defer execution of
    // things which would rely on boot-time info till we've booted
    const self = this
    let doSettingsCleanup = false
    const cleanupIds = []
    // Let's check to see if iOS migration needs to take place

    /* Debug code: Delete all data */
    // function callbackFn (err, success) {
    //   if (err !== null) {
    //     console.error('deleteEverything callbackFn failed')
    //     throw 'PasswordController.InitiateDeleteEverything failed'
    //   }
    //   // console.log('callbackFn called successfully')
    // }
    // const deleteResponse = self.context.persister.RemoveAllData(callbackFn);

    // TODO: Remove web
    // debug: if (self.context.deviceInfo.platform === 'ios' || self.context.deviceInfo.platform === 'web') {
    if (self.context.deviceInfo.platform === 'ios' || self.context.deviceInfo.platform === 'web') {
      let iosMigrationController
      if (self.context.deviceInfo.platform === 'ios') {
        iosMigrationController = new iOSMigrationController(self.context)
      } else { // web
        iosMigrationController = new iOSMigrationController(self.context, true)
      }

      const hasPreviouslyMigrated = await iosMigrationController.hasPreviouslyMigrated
      self.context.shouldDisplayExistingPinScreenForMigration = !hasPreviouslyMigrated
      // iosMigrationController.touchFile(); // For debugging if you're not sure which folder your simulator is running in
      self.context.iosMigrationController = iosMigrationController
      const migrationFileData = await iosMigrationController.getMigrationFiles()

      const migrationPreviouslyPerformed = hasPreviouslyMigrated

      // console.log("migrated previously?");
      if (!(hasPreviouslyMigrated === true)) {
        // Check if previously migrated. If no, we may need to migrate from the old Swift proprietary file format to the new SecureStorage persistence
        const migrationFiles = await iosMigrationController.getMigrationFiles()
        // if (migrationFiles !== false) {
        //   // console.log("Since this didn't return false, we set a context variable to denote that we should display the existing password screen")
        //   self.context.shouldDisplayExistingPinScreenForMigration = true;
        //   // We should now have a list of all possible files
        //   //// console.log(migrationFiles)
        //   let migrationFileData = await iOSMigrationController.getFileData(migrationFiles);
        //   // store these files in context for once the wallet gets unlocked
        //   // console.log("We will be processing the in-memory values once someone logs in successfully - migration process is finalised in PasswordEntryViewController");
        //   self.context.migrationFileData = migrationFileData;
        //   self.context.migrationPerformed = false;
        // }
      }
    }

    //
    // first, check if any password model has been stored

    self.context.persister.AllDocuments(
      CollectionName,
      function (err, contentStrings) {
        if (err) {
          console.error('Error while fetching existing', CollectionName, err)
          throw err
        }

        const contentStrings_length = contentStrings.length
        if (contentStrings_length === 0) { //
          const mocked_doc = JSON.parse(JSON.stringify(k_defaults_record)) // hamfisted copy
          _proceedTo_loadStateFromRecord(mocked_doc)
          return
        }

        if (contentStrings_length > 1) {
          // Version 1.1.19 and below had an issue where multiple settings objects were saved.
          // Version 1.1.20 and up will loop through this state. We'll suppress the warning Android users who have changed their default settings will encounter
          const errStr = 'Error while fetching existing ' + CollectionName + '... more than one record found. Selecting first.'
          doSettingsCleanup = true
          // We want to run self.context.persister.removeDocumentsWithIds(CollectionName, Ids, fn)
          contentStrings.forEach(element => {
            // _deleteSettingsObject(element.id);
            cleanupIds.push(element.id)
          })
          console.error(errStr)
          // this is indicative of a code fault
          // throw errStr // might as well throw then
        }
        let doc = {}
        const plaintextString = contentStrings[0] // NOTE: Settings never gets encrypted -- no sensitive data to encrypt
        doc = contentStrings[0].value
        if (typeof (doc) === 'string') {
          try {
            doc = JSON.parse(doc)
          } catch {
            // improperly formed JSON string -- nuke the Settings object
            doSettingsCleanup = true
          }
        }
        // console.log('💬  Found existing saved ' + CollectionName + ' with _id', doc._id)

        if (doSettingsCleanup == true) {
          _deleteSettingsObject(self, cleanupIds)
          const mocked_doc = JSON.parse(JSON.stringify(k_defaults_record)) // hamfisted copy
          _proceedTo_loadStateFromRecord(mocked_doc)
          return
        }
        _proceedTo_loadStateFromRecord(doc)
      }
    )

    function _deleteSettingsObject (self, Ids) {
      self.context.persister.RemoveDocumentsWithIds(CollectionName, Ids, () => {
        // empty callback
      })
      // for safety's sake, we explicitly force deletion of the index as well
      self.context.persister.__deleteIndex(CollectionName, () => {
        // Removed index
      })
    }

    function _proceedTo_loadStateFromRecord (record_doc) {
      self._id = record_doc._id || undefined
      //
      self.specificAPIAddressURLAuthority = record_doc.specificAPIAddressURLAuthority
      self.appTimeoutAfterS = record_doc.appTimeoutAfterS
      self.invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount = record_doc.invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount
      self.displayCcySymbol = record_doc.displayCcySymbol
      if (typeof record_doc.authentication_requireWhenSending === 'undefined' || record_doc.authentication_requireWhenSending == null) {
        self.authentication_requireWhenSending = k_defaults_record.authentication_requireWhenSending
      } else {
        self.authentication_requireWhenSending = record_doc.authentication_requireWhenSending
      }
      if (typeof record_doc.authentication_requireWhenDisclosingWalletSecrets === 'undefined' || record_doc.authentication_requireWhenDisclosingWalletSecrets == null) {
        self.authentication_requireWhenDisclosingWalletSecrets = k_defaults_record.authentication_requireWhenDisclosingWalletSecrets
      } else {
        self.authentication_requireWhenDisclosingWalletSecrets = record_doc.authentication_requireWhenDisclosingWalletSecrets
      }
      if (typeof record_doc.autoDownloadUpdatesEnabled === 'undefined' || record_doc.autoDownloadUpdatesEnabled == null) {
        self.autoDownloadUpdatesEnabled = k_defaults_record.autoDownloadUpdatesEnabled
      } else {
        self.autoDownloadUpdatesEnabled = record_doc.autoDownloadUpdatesEnabled
      }
      //

      self._setBooted() // all done!
    }
  }

  _setBooted () {
    const self = this
    if (self.hasBooted == true) {
      throw Error('code fault: _setBooted called while self.hasBooted=true')
    }
    self.hasBooted = true
    const fns_length = self._whenBooted_fns.length
    for (let i = 0; i < fns_length; i++) {
      const fn = self._whenBooted_fns[i]
      setTimeout(function () {
        fn() // so it's on 'next tick'
      })
    }
    self._whenBooted_fns = [] // flash for next time
  }

  EventName_settingsChanged_specificAPIAddressURLAuthority () {
    return 'EventName_settingsChanged_specificAPIAddressURLAuthority'
  }

  EventName_settingsChanged_appTimeoutAfterS () {
    return 'EventName_settingsChanged_appTimeoutAfterS'
  }

  EventName_settingsChanged_displayCcySymbol () {
    return 'EventName_settingsChanged_displayCcySymbol'
  }

  EventName_settingsChanged_authentication_requireWhenSending () {
    return 'EventName_settingsChanged_authentication_requireWhenSending'
  }

  EventName_settingsChanged_authentication_requireWhenDisclosingWalletSecrets () {
    return 'EventName_settingsChanged_authentication_requireWhenDisclosingWalletSecrets'
  }

  EventName_settingsChanged_autoDownloadUpdatesEnabled () {
    return 'EventName_settingsChanged_autoDownloadUpdatesEnabled'
  }

  AppTimeoutNeverValue () {
    return -1
  }

  defaultValue__autoDownloadUpdatesEnabled () {
    return k_defaults_record.autoDownloadUpdatesEnabled
  }

  Set_settings_valuesByKey (valuesByKey, fn) {
    const self = this
    self.executeWhenBooted(
      function () {
        const valueKeys = Object.keys(valuesByKey)
        let didUpdate_specificAPIAddressURLAuthority = false
        let didUpdate_appTimeoutAfterS = false
        let didUpdate_displayCcySymbol = false
        let didUpdate_authentication_requireWhenSending = false
        let didUpdate_authentication_requireWhenDisclosingWalletSecrets = false
        let didUpdate_autoDownloadUpdatesEnabled = false
        for (const valueKey of valueKeys) {
          const value = valuesByKey[valueKey]
          { // validate / mark as updated for yield later
            if (valueKey === 'specificAPIAddressURLAuthority') {
              didUpdate_specificAPIAddressURLAuthority = true
            } else if (valueKey === 'appTimeoutAfterS') {
              didUpdate_appTimeoutAfterS = true
            } else if (valueKey === 'displayCcySymbol') {
              didUpdate_displayCcySymbol = true
            } else if (valueKey === 'authentication_requireWhenSending') {
              didUpdate_authentication_requireWhenSending = true
            } else if (valueKey === 'authentication_requireWhenDisclosingWalletSecrets') {
              didUpdate_authentication_requireWhenDisclosingWalletSecrets = true
            } else if (valueKey == 'autoDownloadUpdatesEnabled') {
              didUpdate_autoDownloadUpdatesEnabled = true
            }
            // NOTE: not checking invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount b/c invisible_ and therefore always set programmatically
          }
          { // set
            self[valueKey] = value
          }
        }
        self.saveToDisk(
          function (err) {
            if (err) {
              console.error('Failed to save new valuesByKey', err)
            } else {
              // console.log('📝  Successfully saved ' + self.constructor.name + ' update ', JSON.stringify(valuesByKey))
              if (didUpdate_specificAPIAddressURLAuthority) {
                // console.log('Settings: Emitted didUpdate_specificAPIAddressURLAuthority')

                self.emit(
                  self.EventName_settingsChanged_specificAPIAddressURLAuthority(),
                  self.specificAPIAddressURLAuthority
                )
              }
              if (didUpdate_appTimeoutAfterS) {
                // console.log('Settings: Emitted didUpdate_appTimeoutAfterS')
                self.emit(
                  self.EventName_settingsChanged_appTimeoutAfterS(),
                  self.appTimeoutAfterS
                )
              }
              if (didUpdate_displayCcySymbol) {
                // console.log('Settings: Emitted didUpdate_displayCcySymbol')
                self.emit(
                  self.EventName_settingsChanged_displayCcySymbol(),
                  self.displayCcySymbol
                )
              }
              if (didUpdate_authentication_requireWhenSending) {
                // console.log('Settings: Emitted didUpdate_authentication_requireWhenSending')
                self.emit(
                  self.EventName_settingsChanged_authentication_requireWhenSending(),
                  self.authentication_requireWhenSending
                )
              }
              if (didUpdate_authentication_requireWhenDisclosingWalletSecrets) {
                // console.log('Settings: Emitted didUpdate_authentication_requireWhenDisclosingWalletSecrets')
                self.emit(
                  self.EventName_settingsChanged_authentication_requireWhenDisclosingWalletSecrets(),
                  self.authentication_requireWhenDisclosingWalletSecrets
                )
              }
              if (didUpdate_autoDownloadUpdatesEnabled) {
                // console.log('Settings: Emitted didUpdate_autoDownloadUpdatesEnabled')
                self.emit(
                  self.EventName_settingsChanged_autoDownloadUpdatesEnabled(),
                  self.autoDownloadUpdatesEnabled
                )
              }
            }
            fn(err)
          }
        )
      }
    )
  }

  //
  // Runtime - Imperatives - Private - Deferring until booted
  executeWhenBooted (fn) {
    const self = this
    if (self.hasBooted == true) {
      fn() // ready to execute
      return
    }
    self._whenBooted_fns.push(fn)
  }

  //
  //
  // Runtime - Imperatives - Private - Persistence
  //
  saveToDisk (fn) {
    const self = this
    self.executeWhenBooted(
      function () {
        // console.log('📝  Saving ' + CollectionName + ' to disk.')
        const persistableDocument =
        {
          _id: self._id, // important to set for updates
          specificAPIAddressURLAuthority: self.specificAPIAddressURLAuthority,
          appTimeoutAfterS: self.appTimeoutAfterS,
          invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount: self.invisible_hasAgreedToTermsOfCalculatedEffectiveMoneroAmount,
          displayCcySymbol: self.displayCcySymbol,
          authentication_requireWhenSending: self.authentication_requireWhenSending,
          authentication_requireWhenDisclosingWalletSecrets: self.authentication_requireWhenDisclosingWalletSecrets,
          autoDownloadUpdatesEnabled: self.autoDownloadUpdatesEnabled
        }
        if (self._id === null || typeof self._id === 'undefined') {
          _proceedTo_insertNewDocument(persistableDocument)
        } else {
          _proceedTo_updateExistingDocument(persistableDocument)
        }
        function _proceedTo_insertNewDocument (persistableDocument) {
          const _id = uuidV1() // must generate it
          persistableDocument._id = _id
          //
          const jsonString = JSON.stringify(persistableDocument)
          self.context.persister.InsertDocument(
            CollectionName,
            _id,
            jsonString,
            function (err) {
              if (err) {
                console.error('Error while saving ' + CollectionName + ':', err)
                fn(err)
                return
              }
              self._id = _id // must save it back
              // console.log('✅  Saved newly inserted ' + CollectionName + ' record with _id ' + self._id + '.')
              //// console.log(jsonString)
              fn()
            }
          )
        }
        function _proceedTo_updateExistingDocument (persistableDocument) {
          self.context.persister.UpdateDocumentWithId(
            CollectionName,
            self._id,
            persistableDocument,
            function (err) {
              if (err) {
                console.error('Error while saving update to Settings record:', err)
                fn(err)
                return
              }
              // console.log("✅  Saved update to Settings record with _id " + self._id + ".")
              fn()
            }
          )
        }
      }
    )
  }

  passwordController_ChangePassword (toPassword, fn) {
    const self = this
    if (self.hasBooted !== true) {
      console.warn('⚠️  ' + self.constructor.name + ' asked to ChangePassword but not yet booted.')
      fn('Asked to change password but ' + self.constructor.name + ' not yet booted')
      return // critical: not ready to get this
    }
    self.saveToDisk(function (err) {
      fn(err)
    })
  }

  passwordController_DeleteEverything (fn) {
    const self = this
    // we're not gonna delete the record and reboot - this controller is straightforward enough
    const defaultsValues = JSON.parse(JSON.stringify(k_defaults_record)) // a copy - tho prolly not necessary to do this
    self.Set_settings_valuesByKey(
      defaultsValues,
      function (err) {
        fn(err) // must call back!
      }
    )
  }
}
export default SettingsController
