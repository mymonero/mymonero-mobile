'use strict'

import async from 'async'
import EventEmitter from 'events'
import uuidV1 from 'uuid/v1'
import symmetric_string_cryptor from '../../symmetric_cryptor/symmetric_string_cryptor'
import iOSMigrationController from '../../DocumentPersister/iOSMigrationController'

//const CollectionName = 'PasswordMeta'
const plaintextMessageToSaveForUnlockChallenges = "this is just a string that we'll use for checking whether a given password can unlock an encrypted version of this very message"
const _userSelectedTypesOfPassword =
{
  FreeformStringPW: 'FreeformStringPW', // this goes first as it's recommended to users
  SixCharPIN: 'SixCharPIN'
}
const _humanReadable_AvailableUserSelectableTypesOfPassword =
{
  FreeformStringPW: 'password',
  SixCharPIN: 'PIN'
}

class PasswordController_Base extends EventEmitter {
  constructor (options, context) {
    super()
    // ^--- have to call super before can access `this`
    //
    const self = this
    self.options = options
    self.context = context
    //
    self.deleteEverythingRegistrants = {}
    self.changePasswordRegistrants = {}
    self._whenBooted_fns = []
    //
    self.hasBooted = false
    self.password = undefined // it's not been obtained from the user yet - we only store it in memory
    //
    self.setupAndBoot()
    // function callbackFn (err, success) {
    //   if (err !== null) {
    //     console.error('deleteEverything callbackFn failed')
    //     throw 'PasswordController.InitiateDeleteEverything failed'
    //   }
    //   // console.log('callbackFn called successfully')
    // }
    // const deleteResponse = self.context.persister.RemoveAllData(callbackFn);
  }

  setupAndBoot () {	// we can afford to do this w/o any callback saying "success" because we defer execution of
    // things which would rely on boot-time info till we've booted
    const self = this
    //
    // first, check if any password model has been stored
    self.context.persister.AllDocuments(
      "PasswordMeta",
      function (err, contentStrings) {

        if (err) {
          console.error('Error while fetching existing', "PasswordMeta", err)
          throw err
        }
        const contentStrings_length = contentStrings.length
        if (contentStrings_length === 0) { //
          const mocked_doc =
					{
					  userSelectedTypeOfPassword: self.AvailableUserSelectableTypesOfPassword().FreeformStringPW // default…… for desktop anyway. this might change based on UX direction
					}
          _proceedTo_loadStateFromModel(
            false, // never entered pw before
            mocked_doc
          )
          return
        } else if (contentStrings_length > 1) {
          const errStr = 'Error while fetching existing ' + "PasswordMeta" + '... more than one PasswordModel found. Selecting first.'
          console.error(errStr)
          // this is indicative of a code fault
        } 
        const contentString = contentStrings[0].value
        // this is old -- const plaintextDoc = JSON.parse(contentString) // whole doc is not encrypted - only challenge
        const plaintextDoc = JSON.parse(contentString) // whole doc is not encrypted - only challenge
        // console.log("💬  Found existing saved password model with _id", doc._id)
        _proceedTo_loadStateFromModel(
          true,
          plaintextDoc
        )
      }
    )
    function _proceedTo_loadStateFromModel (
      hasUserSavedAPassword,
      passwordModel_doc
    ) {
      self.hasUserSavedAPassword = hasUserSavedAPassword
      //
      self._id = passwordModel_doc._id || undefined
      self.userSelectedTypeOfPassword = passwordModel_doc.userSelectedTypeOfPassword
      self.encryptedMessageForUnlockChallenge = passwordModel_doc.encryptedMessageForUnlockChallenge
      if (self._id !== null && typeof self._id !== 'undefined') { // existing doc
        if (typeof self.encryptedMessageForUnlockChallenge === 'undefined' || !self.encryptedMessageForUnlockChallenge) { // but it was saved w/o an encrypted challenge str
          const errStr = 'Found undefined encrypted msg for unlock challenge in saved password model document' // TODO: not sure how to handle this case. delete all local info? would suck
          console.error(errStr)
          throw errStr
        }
      }

      self._initial_waitingForFirstPWEntryDecode_passwordModel_doc = passwordModel_doc // this will be nil'd after it's been parsed once the user has entered their pw
      self._setBooted() // all done! call waiting fns
    }
  }

  _setBooted () {
    const self = this
    if (self.hasBooted == true) {
      throw 'code fault: _setBooted called while self.hasBooted=true'
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

  //
  //
  // Setup - Called on post-whole-context-boot (see Delegation below)
  //
  _startObserving_userIdleInWindowController () {
    const self = this
    const controller = self.context.userIdleInWindowController
    if (typeof controller === 'undefined' || controller === null) {
      throw 'nil self.context.userIdleInWindowController'
    }
    controller.on(
      controller.EventName_userDidBecomeIdle(),
      function () {
        if (self.hasUserSavedAPassword !== true) {
          // nothing to do here because the app is not unlocked and/or has no data which would be locked
          // console.log('💬  User became idle but no password has ever been entered/no saved data should exist.')
          return
        } else if (self.HasUserEnteredValidPasswordYet() !== true) {
          // user has saved data but hasn't unlocked the app yet
          // console.log("💬  User became idle and saved data/pw exists, but user hasn't unlocked app yet.")
          return
        }
        self._didBecomeIdleAfterHavingPreviouslyEnteredPassword()
      }
    )
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Accessors - Public

  // either
  EventName_SetFirstPasswordDuringThisRuntime () {
    return 'EventName_SetFirstPasswordDuringThisRuntime'
  }

  // or
  EventName_ChangedPassword () {
    return 'EventName_ChangedPassword'
  }

  //
  //
  EventName_ObtainedNewPassword () {
    return 'EventName_ObtainedNewPassword'
  }

  EventName_ObtainedCorrectExistingPassword () {
    return 'EventName_ObtainedCorrectExistingPassword'
  }

  EventName_ErroredWhileSettingNewPassword () {
    return 'EventName_ErroredWhileSettingNewPassword'
  }

  EventName_ErroredWhileGettingExistingPassword () {
    return 'EventName_ErroredWhileGettingExistingPassword'
  }

  EventName_canceledWhileEnteringExistingPassword () {
    return 'EventName_canceledWhileEnteringExistingPassword'
  }

  EventName_canceledWhileEnteringNewPassword () {
    return 'EventName_canceledWhileEnteringNewPassword'
  }

  EventName_canceledWhileChangingPassword () {
    return 'EventName_canceledWhileChangingPassword'
  }

  EventName_errorWhileChangingPassword () {
    return 'EventName_errorWhileChangingPassword'
  }

  EventName_errorWhileAuthorizingForAppAction () {
    return 'EventName_errorWhileAuthorizingForAppAction'
  }

  EventName_successfullyAuthenticatedForAppAction () {
    return 'EventName_successfullyAuthenticatedForAppAction'
  }

  EventName_SingleObserver_getUserToEnterExistingPasswordWithCB () {
    return 'EventName_SingleObserver_getUserToEnterExistingPasswordWithCB'
  }

  EventName_SingleObserver_getUserToEnterNewPasswordAndTypeWithCB () {
    return 'EventName_SingleObserver_getUserToEnterNewPasswordAndTypeWithCB'
  }

  //
  EventName_willDeconstructBootedStateAndClearPassword () {
    return 'EventName_willDeconstructBootedStateAndClearPassword'
  }

  EventName_didDeconstructBootedStateAndClearPassword () {
    return 'EventName_didDeconstructBootedStateAndClearPassword'
  }

  EventName_havingDeletedEverything_didDeconstructBootedStateAndClearPassword () {
    return 'EventName_havingDeletedEverything_didDeconstructBootedStateAndClearPassword'
  }
  //

  //
  AvailableUserSelectableTypesOfPassword () {
    return _userSelectedTypesOfPassword
  }

  HumanReadable_AvailableUserSelectableTypesOfPassword () {
    return _humanReadable_AvailableUserSelectableTypesOfPassword
  }

  Capitalized_HumanReadable_AvailableUserSelectableTypeOfPassword (passwordType) {
    const humanReadable_passwordType = _humanReadable_AvailableUserSelectableTypesOfPassword[passwordType]
    function __capitalizedString (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
    //
    return __capitalizedString(humanReadable_passwordType)
  }

  //
  HasUserEnteredValidPasswordYet () {
    const self = this
    if (typeof self.password === 'undefined' || self.password === null || self.password === '') {
      return false
    } else {
      return true
    }
  }

  IsUserChangingPassword () {
    const self = this
    const is = self.HasUserEnteredValidPasswordYet() && self.isAlreadyGettingExistingOrNewPWFromUser === true
    //
    return is
  }

  //
  DetectedPasswordTypeFromPassword (password) {
    const self = this
    {
      if (/^\d+$/.test(password) === true) { // and contains only numbers
        return self.AvailableUserSelectableTypesOfPassword().SixCharPIN
      }
    }
    return self.AvailableUserSelectableTypesOfPassword().FreeformStringPW
  }

  //
  //
  // Runtime - Accessors - Internal
  //
  _new_incorrectPasswordValidationErrorMessageString () {
    const self = this
    const passwordType_humanReadableString = self.HumanReadable_AvailableUserSelectableTypesOfPassword()[self.userSelectedTypeOfPassword]
    return `Incorrect ${passwordType_humanReadableString}`
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Imperatives - Public - Password management

  WhenBootedAndPasswordObtained_PasswordAndType (
    fn, // (password, passwordType) -> Void
    optl__userDidCancel_fn
  ) { // this function is for convenience to wrap consumers' waiting for password readiness
    const userDidCancel_fn = optl__userDidCancel_fn || function () {}
    const self = this
    function callBackHavingObtainedPassword () {
      fn(self.password, self.userSelectedTypeOfPassword)
    }
    function callBackHavingCanceled () {
      userDidCancel_fn()
    }
    if (self.HasUserEnteredValidPasswordYet() === true) {
      callBackHavingObtainedPassword()
      return
    }
    // then we have to wait for it
    let hasCalledBack = false
    let hasObtainedPassword = false
    // declaring functions for listeners so we can also unsubscribe
    let onFn_ObtainedNewPassword_fn
    let onFn_ObtainedCorrectExistingPassword_fn
    let onFn_canceledWhileEnteringExistingPassword_fn
    let onFn_canceledWhileEnteringNewPassword_fn
    function __startListening () {
      onFn_ObtainedNewPassword_fn = function () {
        _aPasswordWasObtained()
      }
      onFn_ObtainedCorrectExistingPassword_fn = function () {
        _aPasswordWasObtained()
      }
      onFn_canceledWhileEnteringExistingPassword_fn = function () {
        _obtainingPasswordWasCanceled()
      }
      onFn_canceledWhileEnteringNewPassword_fn = function () {
        _obtainingPasswordWasCanceled()
      }
      self.on(self.EventName_ObtainedNewPassword(), onFn_ObtainedNewPassword_fn)
      self.on(self.EventName_ObtainedCorrectExistingPassword(), onFn_ObtainedCorrectExistingPassword_fn)
      self.on(self.EventName_canceledWhileEnteringExistingPassword(), onFn_canceledWhileEnteringExistingPassword_fn)
      self.on(self.EventName_canceledWhileEnteringNewPassword(), onFn_canceledWhileEnteringNewPassword_fn)
    }
    function __stopListening () {
      self.removeListener(self.EventName_ObtainedNewPassword(), onFn_ObtainedNewPassword_fn)
      self.removeListener(self.EventName_ObtainedCorrectExistingPassword(), onFn_ObtainedCorrectExistingPassword_fn)
      self.removeListener(self.EventName_canceledWhileEnteringExistingPassword(), onFn_canceledWhileEnteringExistingPassword_fn)
      self.removeListener(self.EventName_canceledWhileEnteringNewPassword(), onFn_canceledWhileEnteringNewPassword_fn)
      onFn_ObtainedNewPassword_fn = null
      onFn_ObtainedCorrectExistingPassword_fn = null
      onFn_canceledWhileEnteringExistingPassword_fn = null
      onFn_canceledWhileEnteringNewPassword_fn = null
    }
    function ___guardAllCallBacks () {
      if (hasCalledBack === true) {
        // console.log('PasswordController/WhenBootedAndPasswordObtained_PasswordAndType hasCalledBack already true')
        console.trace()
        return false // ^- shouldn't happen but just in case…
      }
      hasCalledBack = true
      return true
    }
    function _aPasswordWasObtained () {
      hasObtainedPassword = true
      if (___guardAllCallBacks() != false) {
        __stopListening() // immediately unsubscribe
        callBackHavingObtainedPassword()
      }
    }
    function _obtainingPasswordWasCanceled () {
      if (___guardAllCallBacks() != false) {
        __stopListening() // immediately unsubscribe
        callBackHavingCanceled()
      }
    }
    // subscribe
    __startListening()
    // now that we're subscribed, initiate the pw request
    self.OnceBooted_GetNewPasswordAndTypeOrExistingPasswordFromUserAndEmitIt()
  }

  async OnceBooted_GetNewPasswordAndTypeOrExistingPasswordFromUserAndEmitIt () {	// This function must be called in order to initiate a password entry screen being shown to the user and to initiate any "password obtained" emits
    const self = this
    self._executeWhenBooted(
      function () {
        if (self.HasUserEnteredValidPasswordYet() === true) {
          console.warn(self.constructor.name + ' asked to OnceBooted_GetNewPasswordAndTypeOrExistingPasswordFromUserAndEmitIt but already has password.')
          return // already got it
        }
        { // guard
          if (self.isAlreadyGettingExistingOrNewPWFromUser === true) {
            // console.warn("⚠️  isAlreadyGettingExistingOrNewPWFromUser=true. Exiting instead of re-initiating.")
            return // only need to wait for it to be obtained
          }
          self.isAlreadyGettingExistingOrNewPWFromUser = true
        }
        // we'll use this in a couple places
        const isForChangePassword = false // this is simply for requesting to have the existing or a new password from the user
        const isForAuthorizingAppActionOnly = false
        const customNavigationBarTitle_orNull = null
        if (typeof self._id === 'undefined' || self._id === null) { // if the user is not unlocking an already pw-protected app
          // then we need to get a new PW from the user
          self.obtainNewPasswordFromUser(isForChangePassword) // this will also call self.unguard_getNewOrExistingPassword()
        } else { // then we need to get the existing PW and check it against the encrypted message
          //
          if (typeof self.encryptedMessageForUnlockChallenge === 'undefined' && !self.encryptedMessageForUnlockChallenge) {
            const errStr = 'Code fault: Existing document but no encryptedMessageForUnlockChallenge'
            console.error(errStr)
            self.unguard_getNewOrExistingPassword()
            throw errStr
          }

          // refactored because callback hell
          let getUserToEnterPasswordCallback = async function (didCancel_orNil, validationErr_orNil, existingPassword) {
            if (validationErr_orNil != null) { // takes precedence over cancel
              self.unguard_getNewOrExistingPassword()
              self.emit(self.EventName_ErroredWhileGettingExistingPassword(), validationErr_orNil)
              return
            }
            if (didCancel_orNil === true) {
              self.emit(self.EventName_canceledWhileEnteringExistingPassword())
              self.unguard_getNewOrExistingPassword()
              return // just silently exit after unguarding
            }

            // If we are in the process of a migration, we need to run the decryptedstring__async call against data stored in memory
            let decryptionCallback = async function(err, decryptedMessage) {
              if (decryptedMessage === plaintextMessageToSaveForUnlockChallenges) {
                try {
                  let doMigration = await self.context.iosMigrationController.performMigration(existingPassword);
                  let walletRecords = await self.context.persister.AllDocuments("Wallets", (err, data) => {                   
                    self._didObtainPassword(existingPassword)
                    // self.unguard_getNewOrExistingPassword()
                    // self.emit(self.EventName_ObtainedCorrectExistingPassword())
                    // self.context.walletsListController.__listUpdated_records()

                  }) // all wallets returned by this stage, so emit update events

                  self.unguard_getNewOrExistingPassword()
                  self.emit(self.EventName_ObtainedCorrectExistingPassword())
                  self.context.walletsListController.__listUpdated_records()

                } catch (error) {
                  throw error;
                }

              } else {
                // error
                const errStr = self._new_incorrectPasswordValidationErrorMessageString()
                const err = new Error(errStr)
                self.unguard_getNewOrExistingPassword()
                self.emit(self.EventName_ErroredWhileGettingExistingPassword(), err)
                return
              }
            }
            
            symmetric_string_cryptor.New_DecryptedString__Async(
              self.encryptedMessageForUnlockChallenge,
              existingPassword, 
              function(err, decryptedMessage) {
                // console.log("Done decryption");
                if (decryptedMessage === plaintextMessageToSaveForUnlockChallenges) {
                  // console.log("Decryption matches!");
                  
                  let iosMigrationController = self.context.iosMigrationController // new iOSMigrationController(self.context)

                  self._didObtainPassword(existingPassword)
                  self.unguard_getNewOrExistingPassword()
                  self.emit(self.EventName_ObtainedCorrectExistingPassword())
                } else {
                  // error
                  const errStr = self._new_incorrectPasswordValidationErrorMessageString()
                  const err = new Error(errStr)
                  self.unguard_getNewOrExistingPassword()
                  self.emit(self.EventName_ErroredWhileGettingExistingPassword(), err)
                  return
                }
            });
          }

          // This used to be callback hell, but we now pass a named function as the callback handler 
          self._getUserToEnterTheirExistingPassword(
            isForChangePassword, 
            isForAuthorizingAppActionOnly, 
            customNavigationBarTitle_orNull, 
            getUserToEnterPasswordCallback)
        }
      }
    )
  }

  Initiate_ChangePassword () {
    const self = this
    self._executeWhenBooted(function () {
      if (self.HasUserEnteredValidPasswordYet() === false) {
        const errStr = 'Initiate_ChangePassword called but HasUserEnteredValidPasswordYet === false. This should be disallowed in the UI'
        throw errStr
      }
      { // guard
        if (self.isAlreadyGettingExistingOrNewPWFromUser === true) {
          const errStr = 'Initiate_ChangePassword called but isAlreadyGettingExistingOrNewPWFromUser === true. This should be precluded in the UI'
          throw errStr
          // only need to wait for it to be obtained
        }
        self.isAlreadyGettingExistingOrNewPWFromUser = true
      }
      // ^-- we're relying on having checked above that user has entered a valid pw already
      const isForChangePassword = true // we'll use this in a couple places
      const isForAuthorizingAppActionOnly = false
      const customNavigationBarTitle_orNull = null
      self._getUserToEnterTheirExistingPassword(
        isForChangePassword,
        isForAuthorizingAppActionOnly,
        customNavigationBarTitle_orNull,
        function (didCancel_orNil, validationErr_orNil, entered_existingPassword) {
          if (validationErr_orNil != null) { // takes precedence over cancel
            self.unguard_getNewOrExistingPassword()
            self.emit(self.EventName_errorWhileChangingPassword(), validationErr_orNil)
            return
          }
          if (didCancel_orNil === true) {
            self.unguard_getNewOrExistingPassword()
            self.emit(self.EventName_canceledWhileChangingPassword())
            return // just silently exit after unguarding
          }
          // v-- is this check a point of weakness? better to try decrypt?
          if (self.password !== entered_existingPassword) {
            self.unguard_getNewOrExistingPassword()
            const errStr = self._new_incorrectPasswordValidationErrorMessageString()
            const err = new Error(errStr)
            self.emit(self.EventName_errorWhileChangingPassword(), err)
            return
          }
          // passwords match checked as necessary, we can proceed
          self.obtainNewPasswordFromUser(isForChangePassword)
        }
      )
    })
  }

  Initiate_VerifyUserAuthenticationForAction (
    customNavigationBarTitle_orNull, // String? -- null if you don't want one
    canceled_fn, // () -> Void
    entryAttempt_succeeded_fn // () -> Void
  ) {
    const self = this
    self._executeWhenBooted(function () {
      if (self.HasUserEnteredValidPasswordYet() === false) {
        const errStr = 'Initiate_VerifyUserAuthenticationForAction called but HasUserEnteredValidPasswordYet === false. This should be disallowed in the UI'
        throw errStr
      }
      { // guard
        if (self.isAlreadyGettingExistingOrNewPWFromUser === true) {
          const errStr = 'Initiate_VerifyUserAuthenticationForAction called but isAlreadyGettingExistingOrNewPWFromUser === true. This should be precluded in the UI'
          throw errStr
          // only need to wait for it to be obtained
        }
        self.isAlreadyGettingExistingOrNewPWFromUser = true
      }
      // ^-- we're relying on having checked above that user has entered a valid pw already
      // proceed to verify via passphrase check
      const isForChangePassword = false
      const isForAuthorizingAppActionOnly = true
      self._getUserToEnterTheirExistingPassword(
        isForChangePassword,
        isForAuthorizingAppActionOnly,
        customNavigationBarTitle_orNull,
        function (didCancel_orNil, validationErr_orNil, entered_existingPassword) {
          if (validationErr_orNil != null) { // takes precedence over cancel
            self.unguard_getNewOrExistingPassword()
            self.emit(self.EventName_errorWhileAuthorizingForAppAction(), validationErr_orNil)
            return
          }
          if (didCancel_orNil === true) {
            self.unguard_getNewOrExistingPassword()
            //
            // currently there's no need of a .canceledWhileAuthorizingForAppAction note post here
            canceled_fn() // but must call cb
            //
            return
          }
          // v-- is this check a point of weakness? better to try decrypt?
          if (self.password !== entered_existingPassword) {
            self.unguard_getNewOrExistingPassword()
            const errStr = self._new_incorrectPasswordValidationErrorMessageString()
            const err = new Error(errStr)
            self.emit(self.EventName_errorWhileAuthorizingForAppAction(), err)
            return
          }
          self.unguard_getNewOrExistingPassword() // must be called
          self.emit(self.EventName_successfullyAuthenticatedForAppAction()) // this must be posted so the PresentationController can dismiss the entry modal
          entryAttempt_succeeded_fn()
        }
      )
    })
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Imperatives - Private - Requesting password from user

  unguard_getNewOrExistingPassword () {
    const self = this
    self.isAlreadyGettingExistingOrNewPWFromUser = false
  }

  _getUserToEnterTheirExistingPassword (
    isForChangePassword,
    isForAuthorizingAppActionOnly,
    customNavigationBarTitle_orNull,
    fn // (didCancel_orNil?, validationErr_orNil?, existingPassword?) -> Void
  ) {
    const self = this
    let isCurrentlyLockedOut = false
    let unlock_timeout = null
    let numberOfTriesDuringThisTimePeriod = 0
    let dateOf_firstPWTryDuringThisTimePeriod = new Date()
    function __cancelAnyAndRebuild_unlock_timeout () {
      const wasAlreadyLockedOut = unlock_timeout !== null
      if (unlock_timeout !== null) {
        // console.log("💬  clearing existing unlock timer")
        clearTimeout(unlock_timeout)
        unlock_timeout = null // not strictly necessary
      }
      const unlockInT_s = 10 // allows them to try again every 20 s, but resets timer if they submit w/o waiting
      // console.log(`🚫 Too many password entry attempts within ${unlockInT_s}s. ${!wasAlreadyLockedOut ? 'Locking out' : 'Extending lockout.'}.`)
      unlock_timeout = setTimeout(function () {
        // console.log('⭕️  Unlocking password entry.')
        isCurrentlyLockedOut = false
        fn(null, '', null) // this is _sort_ of a hack and should be made more explicit in API but I'm sending an empty string, and not even an Error, to clear the validation error so the user knows to try again
      }, unlockInT_s * 1000)
    }
    if (isForChangePassword && isForAuthorizingAppActionOnly) {
      throw 'Illegal: isForChangePassword && isForAuthorizingAppActionOnly'
    }

    self.emit(
      self.EventName_SingleObserver_getUserToEnterExistingPasswordWithCB(),
      isForChangePassword,
      isForAuthorizingAppActionOnly,
      customNavigationBarTitle_orNull,
      function (didCancel_orNil, obtainedPasswordString) // we don't have them pass back the type because that will already be known by self
      { // we're passing a function that the single observer should call
        let validationErr_orNil = null // so far…
        if (didCancel_orNil === true) {
          // console.info("userDidCancel while having user enter their existing password")
          // do not emit here
        } else {
          // user did not cancel… let's check if we need to send back a pre-emptive validation err (such as because they're trying too much)
          if (isCurrentlyLockedOut == false) {
            if (numberOfTriesDuringThisTimePeriod == 0) {
              dateOf_firstPWTryDuringThisTimePeriod = new Date()
            }
            numberOfTriesDuringThisTimePeriod += 1
            const maxLegal_numberOfTriesDuringThisTimePeriod = 5
            if (numberOfTriesDuringThisTimePeriod > maxLegal_numberOfTriesDuringThisTimePeriod) { // rhs must be > 0
              numberOfTriesDuringThisTimePeriod = 0
              // ^- no matter what, we're going to need to reset the above state for the next 'time period'
              //
              const now = new Date()
              const ms_dateRange = now.getTime() - dateOf_firstPWTryDuringThisTimePeriod.getTime()
              const ms_since_firstPWTryDuringThisTimePeriod = Math.abs(ms_dateRange)
              const s_since_firstPWTryDuringThisTimePeriod = ms_since_firstPWTryDuringThisTimePeriod / 1000
              const noMoreThanNTriesWithin_s = 30
              if (s_since_firstPWTryDuringThisTimePeriod > noMoreThanNTriesWithin_s) { // enough time has passed since this group began - only reset the "time period" with tries->0 and let this pass through as valid check
                dateOf_firstPWTryDuringThisTimePeriod = null // not strictly necessary to do here as we reset the number of tries during this time period to zero just above
                // console.log(`There were more than ${maxLegal_numberOfTriesDuringThisTimePeriod} password entry attempts during this time period but the last attempt was more than ${noMoreThanNTriesWithin_s}s ago, so letting this go.`)
              } else { // simply too many tries!…
                // lock it out for the next time (supposing this try does not pass)
                isCurrentlyLockedOut = true
              }
            }
          }
          if (isCurrentlyLockedOut == true) { // do not try to check pw - return as validation err
            // console.log('🚫  Received password entry attempt but currently locked out.')
            validationErr_orNil = new Error('As a security precaution, please wait a few moments before trying again.')
            // setup or extend unlock timer - NOTE: this is pretty strict - we don't strictly need to extend the timer each time to prevent spam unlocks
            __cancelAnyAndRebuild_unlock_timeout()
          }
        }
        // regardless of whether canceled, we
        fn(didCancel_orNil, validationErr_orNil, obtainedPasswordString)
      }
    )
  }

  _getUserToEnterNewPassword (
    isForChangePassword,
    fn // (didCancel_orNil?, existingPassword?) -> Void
  ) {
    const self = this
    self.emit(
      self.EventName_SingleObserver_getUserToEnterNewPasswordAndTypeWithCB(),
      isForChangePassword,
      function (didCancel_orNil, obtainedPasswordString, userSelectedTypeOfPassword) { // we're passing a function that the single observer should call
        if (didCancel_orNil) {
          // don't emit here - consumer will
        }
        fn(didCancel_orNil, obtainedPasswordString, userSelectedTypeOfPassword)
      }
    )
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Imperatives - Private - Setting/changing Password

  obtainNewPasswordFromUser (isForChangePassword) {
    const self = this
    const wasFirstSetOfPasswordAtRuntime = self.HasUserEnteredValidPasswordYet() === false // it's ok if we derive this here instead of in obtainNewPasswordFromUser because this fn will only be called, if setting the pw for the first time, if we have not yet accepted a valid PW yet
    //
    const old_password = self.password // this may be undefined
    const old_userSelectedTypeOfPassword = self.userSelectedTypeOfPassword
    //
    self._getUserToEnterNewPassword(
      isForChangePassword,
      function (didCancel_orNil, obtainedPasswordString, userSelectedTypeOfPassword) {
        if (didCancel_orNil === true) {
          self.emit(self.EventName_canceledWhileEnteringNewPassword())
          self.unguard_getNewOrExistingPassword()
          return // just silently exit after unguarding
        }
        //
        // I. Validate features of pw before trying and accepting
        if (userSelectedTypeOfPassword === self.AvailableUserSelectableTypesOfPassword().SixCharPIN) {
          if (obtainedPasswordString.length < 6) { // this is too short. get back to them with a validation err by re-entering obtainPasswordFromUser_cb
            self.unguard_getNewOrExistingPassword()
            const err = new Error('Please enter a longer PIN.')
            self.emit(self.EventName_ErroredWhileSettingNewPassword(), err)
            return // bail
          }
          // TODO: check if all numbers
          // TODO: check that numbers are not all just one number
        } else if (userSelectedTypeOfPassword === self.AvailableUserSelectableTypesOfPassword().FreeformStringPW) {
          if (obtainedPasswordString.length < 6) { // this is too short. get back to them with a validation err by re-entering obtainPasswordFromUser_cb
            self.unguard_getNewOrExistingPassword()
            const err = new Error('Please enter a longer password.')
            self.emit(self.EventName_ErroredWhileSettingNewPassword(), err)
            return // bail
          }
          // TODO: check if password content too weak?
        } else { // this is weird - code fault or cracking attempt?
          self.unguard_getNewOrExistingPassword()
          const err = new Error('Unrecognized password type')
          self.emit(self.EventName_ErroredWhileSettingNewPassword(), err)
          throw err
        }
        if (isForChangePassword === true) {
          if (self.password === obtainedPasswordString) { // they are disallowed from using change pw to enter the same pw… despite that being convenient for dev ;)
            self.unguard_getNewOrExistingPassword()

            let err
            if (userSelectedTypeOfPassword === self.AvailableUserSelectableTypesOfPassword().FreeformStringPW) {
              err = new Error('Please enter a fresh password.')
            } else if (userSelectedTypeOfPassword === self.AvailableUserSelectableTypesOfPassword().SixCharPIN) {
              err = new Error('Please enter a fresh PIN.')
            } else {
              err = new Error('Unrecognized password type')
              throw err
            }
            self.emit(self.EventName_ErroredWhileSettingNewPassword(), err)
            return // bail
          }
        }
        //
        // II. hang onto new pw, pw type, and state(s)
        // console.log('💬  Obtained ' + userSelectedTypeOfPassword + ' ' + obtainedPasswordString.length + ' chars long')
        self._didObtainPassword(obtainedPasswordString)
        self.userSelectedTypeOfPassword = userSelectedTypeOfPassword
        //
        // III. finally, save doc (and unlock on success) so we know a pw has been entered once before
        self.saveToDisk(
          function (err) {
            if (err) {
              self.unguard_getNewOrExistingPassword()
              self.password = old_password // they'll have to try again
              self.userSelectedTypeOfPassword = old_userSelectedTypeOfPassword // they'll have to try again
              self.emit(self.EventName_ErroredWhileSettingNewPassword(), err)
              return
            }
            if (wasFirstSetOfPasswordAtRuntime === true) {
              self.unguard_getNewOrExistingPassword()
              self.emit(self.EventName_SetFirstPasswordDuringThisRuntime(), self.password, self.userSelectedTypeOfPassword)
              // general purpose emit
              self.emit(self.EventName_ObtainedNewPassword(), self.password, self.userSelectedTypeOfPassword)
            } else {
              self._changePassword_tellRegistrants_doTaskFn(
                function (taskRegistrant, taskDone_fn) {
                  taskRegistrant.passwordController_ChangePassword(
                    self.password,
                    function (err) {
                      taskDone_fn(err)
                    }
                  )
                },
                function (changePassword_err) {
                  if (changePassword_err) {
                    // try to revert save files to old password...
                    self.password = old_password
                    self.userSelectedTypeOfPassword = old_userSelectedTypeOfPassword
                    //
                    self.saveToDisk(function (err) { // save self first..
                      if (err) {
                        throw err
                      }
                      self._changePassword_tellRegistrants_doTaskFn(
                        function (taskRegistrant, taskDone_fn) {
                          taskRegistrant.passwordController_ChangePassword( // this may well end up failing...
                            self.password,
                            function (err) {
                              taskDone_fn(err)
                            }
                          )
                        },
                        function (err) {
                          if (err) {
                            throw err
                          }
                          self.unguard_getNewOrExistingPassword() // this is important
                          // and this is not success but the end of reverting aftr an error, so emit the error
                          self.emit(self.EventName_ErroredWhileSettingNewPassword(), changePassword_err) // original err
                        }
                      )
                    })
                  } else {
                    self.unguard_getNewOrExistingPassword()
                    self.emit(self.EventName_ChangedPassword(), self.password, self.userSelectedTypeOfPassword) // not much used anymore - never use it for critical things
                    // general purpose emit
                    self.emit(self.EventName_ObtainedNewPassword(), self.password, self.userSelectedTypeOfPassword)
                  }
                }
              )
            }
          }
        )
      }
    )
  }

  _changePassword_tellRegistrants_doTaskFn (task_fn, end_fn) {
    const self = this
    const tokens = Object.keys(self.changePasswordRegistrants)
    async.each( // parallel; waits till all subscribers finished writing data successfully
      tokens,
      function (token, registrant_cb) {
        const registrant = self.changePasswordRegistrants[token]
        task_fn(registrant, function (err) {
          registrant_cb(err)
        })
      },
      function (err) {
        end_fn(err) // must be called
      }
    )
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Imperatives - Private - Deferring until booted

  _executeWhenBooted (fn) {
    const self = this
    if (self.hasBooted == true) {
      fn() // ready to execute
      return
    }
    // console.log("Deferring execution of function until booted.")
    self._whenBooted_fns.push(fn)
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // Runtime - Imperatives - Private - Persistence

  async saveToDisk (fn) {
    const self = this
    // console.log("📝  Saving password model to disk.")
    //
    if (self.password === null || typeof self.password === 'undefined') {
      const errStr = "Code fault: saveToDisk musn't be called until a password has been set"
      console.error(errStr)
      fn(new Error(errStr))
      throw errStr
    }
    const encryptedMessageForUnlockChallenge = symmetric_string_cryptor.New_EncryptedBase64String__Async(
      plaintextMessageToSaveForUnlockChallenges,
      self.password,
      function (err, encryptedMessageForUnlockChallenge) {
        if (err) {
          console.error('Error while encrypting message for unlock challenge:', err)
          fn(err)
          throw err
        }
        self.encryptedMessageForUnlockChallenge = encryptedMessageForUnlockChallenge // it's important that we hang onto this in memory so we can access it if we need to change the password later
        const persistableDocument =
				{
				  _id: self.id, // critical for update
				  userSelectedTypeOfPassword: self.userSelectedTypeOfPassword,
				  encryptedMessageForUnlockChallenge: self.encryptedMessageForUnlockChallenge
				}

				// insert & update fn declarations for imminent usage…
        if (self._id === null || typeof self._id === 'undefined') {
          _proceedTo_insertNewDocument(persistableDocument, self.context)
        } else {
          _proceedTo_updateExistingDocument(persistableDocument)
        }
      }
    )
    async function _proceedTo_insertNewDocument (persistableDocument, context = null) {
      const _id = uuidV1() // generate new
      persistableDocument._id = _id
      //
      const jsonString = JSON.stringify(persistableDocument)
      self.context.persister.InsertDocument(
        "PasswordMeta",
        _id,
        persistableDocument,
        async function (err) {
          if (err) {
            console.error('Error while saving password record:', err)
            fn(err)
            return
          }
          self._id = _id // must save it back
          // Before we run this callback, we send an event that shows that passwordMeta has been saved successfully
          
          let passwordMetaSaveEvent = new CustomEvent('passwordMetaInserted', {
            detail: persistableDocument
          })
          document.dispatchEvent(passwordMetaSaveEvent)
          if (context.deviceInfo.platform === 'ios') {
            let migrationResult = await context.iosMigrationController.performMigration(context.passwordController.password)
          }
          self._didObtainPassword(self.context.passwordController.password)
          self.unguard_getNewOrExistingPassword()
          setTimeout(() => {
            // Because of all the race conditions, we wait half a second to let asynchronous calls finish
            self.emit(self.EventName_ObtainedCorrectExistingPassword())
            // console.log("Saved password stuff and migrated");
            // console.log("✅  Saved newly inserted password record with _id " + self._id + ".")
            fn()
          }, 500)
        }
      )
    }
    function _proceedTo_updateExistingDocument (persistableDocument) {
      self.context.persister.UpdateDocumentWithId(
        "PasswordMeta",
        self._id,
        persistableDocument,
        function (err) {
          if (err) {
            console.error('Error while saving update to password record:', err)
            fn(err)
            return
          }
          // console.log("✅  Saved update to password record with _id " + self._id + ".")
          fn()
        }
      )
    }
  }

  //
  //
  // Runtime - Delegation - Obtained password
  //
  _didObtainPassword (password) {
    const self = this
    const existing_hasUserSavedAPassword = self.hasUserSavedAPassword
    self.password = password
    self.hasUserSavedAPassword = true // we can now flip this to true
    //
    const waiting_passwordModel_doc = self._initial_waitingForFirstPWEntryDecode_passwordModel_doc
    if (typeof waiting_passwordModel_doc !== 'undefined' && waiting_passwordModel_doc !== null) {
      self._initial_waitingForFirstPWEntryDecode_passwordModel_doc = null // zero so we don't do this more than once
    }
  }

  //
  //
  // Runtime - Imperatives - Delete everything
  //
  InitiateDeleteEverything (fn) { // this is used as a central initiation/sync point for delete everything like user idle
    // maybe it should be moved, maybe not.
    // And note we're assuming here the PW has been entered already.
    function callbackFn (err, success) {
      if (err !== null) {
        console.error('deleteEverything callbackFn failed')
        throw 'PasswordController.InitiateDeleteEverything failed'
      }
    }
    const self = this
    if (self.hasUserSavedAPassword !== true) {
      const errStr = 'InitiateDeleteEverything called but hasUserSavedAPassword !== true. This should be disallowed in the UI'
      throw errStr
    }
    self._deconstructBootedStateAndClearPassword(
      true, // yes, is for a 'delete everything'
      function (cb) {
        // reset state cause we're going all the way back to pre-boot
        self.hasBooted = false // require this pw controller to boot
        self.password = undefined // this is redundant but is here for clarity
        self.hasUserSavedAPassword = false
        self._id = undefined
        self.encryptedMessageForUnlockChallenge = undefined
        self._initial_waitingForFirstPWEntryDecode_passwordModel_doc = undefined

        // first have all registrants delete everything
        // const tokens = Object.keys(self.deleteEverythingRegistrants)

        const response = self.context.persister.RemoveAllData(callbackFn)

        // async.each( // parallel; waits till all finished
        // 	tokens,
        // 	function(token, registrant_cb)
        // 	{
        // 		const registrant = self.deleteEverythingRegistrants[token]
        // 		registrant.passwordController_DeleteEverything(function(err)
        // 		{
        // 			registrant_cb(err)
        // 		})
        // 	},
        // 	function(err)
        // 	{
        // 		if (err) {
        // 			cb(err)
        // 			return // will travel back to the 'throw' below
        // 		}
        // 		//
        // 		// then delete pw record - after registrants in case any of them fail and user still needs to be able to delete some of them on next boot
        // 		self.context.persister.RemoveAllDocuments(
        // 			"PasswordMeta",
        // 			function(err)
        // 			{
        // 				if (err) {
        // 					cb(err)
        // 					return
        // 				}
        // 				// console.log("🗑  Deleted password record.")
        // 				self.setupAndBoot() // now trigger a boot before we call cb (tho we could do it after - consumers will wait for boot)
        // 				//
        // 				cb(err)
        // 			}
        // 		)
        // 	}
        // )
      },
      function (err) {
        if (err) {
          fn(err)
          throw err // throwing because self's runtime is not in a good state given un-setting of instance props like .password
        }
        self.emit(self.EventName_havingDeletedEverything_didDeconstructBootedStateAndClearPassword())
        fn()
      }
    )
  }

  // Written for the < 0.1% of iOS users with wallet importation problems when migrating from old app to new
  InitiateImportReset (fn) { 
    // maybe it should be moved, maybe not.
    // And note we're assuming here the PW has been entered already.
    function callbackFn (err, success) {
      if (err !== null) {
        console.error('deleteEverything callbackFn failed')
        throw 'PasswordController.InitiateDeleteEverything failed'
      }
    }
    const self = this
    self._deconstructBootedStateAndClearPassword(
      true, // yes, is for a 'delete everything'
      function (cb) {
        // reset state cause we're going all the way back to pre-boot
        self.hasBooted = false // require this pw controller to boot
        self.password = undefined // this is redundant but is here for clarity
        self.hasUserSavedAPassword = false
        self._id = undefined
        self.encryptedMessageForUnlockChallenge = undefined
        self._initial_waitingForFirstPWEntryDecode_passwordModel_doc = undefined
        const response = self.context.persister.RemoveImportFlag(callbackFn)
      },
      function (err) {
        if (err) {
          fn(err)
          throw err // throwing because self's runtime is not in a good state given un-setting of instance props like .password
        }
        self.emit(self.EventName_havingDeletedEverything_didDeconstructBootedStateAndClearPassword())
        fn()
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

  //
  //
  // Runtime - Imperatives - App lock down interface (special case usage only)
  //
  LockDownAppAndRequirePassword () { // just a public interface for this - special-case-usage only! (so far. see index.cordova.js.)
    const self = this
    if (self.HasUserEnteredValidPasswordYet() === false) { // this is fine, but should be used to bail
      console.warn('⚠️  Asked to LockDownAppAndRequirePassword but no password entered yet.')
      return
    }
    // console.log('💬  Will LockDownAppAndRequirePassword')
    self._deconstructBootedStateAndClearPassword(
      false // not for a 'delete everything'
    )
  }

  //
  //
  // Runtime - Imperatives - Boot-state deconstruction/teardown
  //
  _deconstructBootedStateAndClearPassword (
    optl_isForADeleteEverything,
    hasFiredWill_fn, // (cb) -> Void; cb: (err?) -> Void
    fn
  ) {
    const self = this
    //
    const isForADeleteEverything = optl_isForADeleteEverything === true
    hasFiredWill_fn = hasFiredWill_fn || function (cb) { cb() }
    fn = fn || function (err) {}
    // TODO:? do we need to cancel any waiting functions here? not sure it would be possible to have any (unless code fault)…… we'd only deconstruct the booted state and pop the enter pw screen here if we had already booted before - which means there theoretically shouldn't be such waiting functions - so maybe assert that here - which requires hanging onto those functions somehow
    { // indicate to consumers they should tear down and await the "did" event to re-request
      const params =
			{
			  isForADeleteEverything: isForADeleteEverything
			}
      self.emit(self.EventName_willDeconstructBootedStateAndClearPassword(), params)
    }
    setTimeout(function () { // on next tick…
      hasFiredWill_fn(
        function (err) {
          if (err) {
            fn(err)
            return
          }
          { // trigger deconstruction of booted state and require password
            self.password = undefined
          }
          { // we're not going to call WhenBootedAndPasswordObtained_PasswordAndType because consumers will call it for us after they tear down their booted state with the "will" event and try to boot/decrypt again when they get this "did" event
            self.emit(self.EventName_didDeconstructBootedStateAndClearPassword())
          }
          fn()
        }
      )
    }, 2)
  }

  //
  //
  // Runtime - Delegation - User having become idle -> teardown booted state and require pw
  //
  _didBecomeIdleAfterHavingPreviouslyEnteredPassword () {
    const self = this
    self._deconstructBootedStateAndClearPassword(
      false // not for a 'delete everything'
    )
  }

  //
  //
  // Runtime - Delegation - Post-instantiation hook
  //
  RuntimeContext_postWholeContextInit_setup () {
    const self = this
    // We have to wait until post-whole-context-init to guarantee all controllers exist
    self._startObserving_userIdleInWindowController()
  }
}
export default PasswordController_Base
