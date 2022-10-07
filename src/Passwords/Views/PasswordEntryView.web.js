'use strict'

import View from '../../Views/View.web'
import EnterExistingPasswordView from './EnterExistingPasswordView.web'
import EnterNewPasswordView from './EnterNewPasswordView.web'
import StackAndModalNavigationView from '../../StackNavigation/Views/StackAndModalNavigationView.web'
import iOSMigrationController from '../../DocumentPersister/iOSMigrationController'
import symmetric_string_cryptor from '../../symmetric_cryptor/symmetric_string_cryptor'

const passwordEntryTaskModes =
{
  None: 'None',
  ForMigratingFromOldIOSVersion: "ForMigratingFromOldIOSVersion",
  ForUnlockingApp_ExistingPasswordGivenType: 'ForUnlockingApp_ExistingPasswordGivenType',
  ForFirstEntry_NewPasswordAndType: 'ForFirstEntry_NewPasswordAndType',
  ForChangingPassword_ExistingPasswordGivenType: 'ForChangingPassword_ExistingPasswordGivenType',
  ForChangingPassword_NewPasswordAndType: 'ForChangingPassword_NewPasswordAndType',
  ForAuthorizingAppAction: 'ForAuthorizingAppAction'
}

class PasswordEntryView extends StackAndModalNavigationView {
  setup () {
    const self = this
    //
    super.setup()
    //
    self.passwordEntryTaskMode = passwordEntryTaskModes.None
    //
    self._setup_views()
    self._setup_startObserving()
    //
  }

  // Views/layers
  _setup_views () {
    const self = this
    self._setup_self_layer()
  }

  _setup_self_layer () {
    const self = this
    const layer = self.layer
    layer.style.backgroundColor = '#272527'
    layer.style.width = '100%'
    layer.style.height = '100%'
  }

  // Observation
  _setup_startObserving () {
    const self = this
  }

  //
  //
  //
  //
  TearDown () {
    const self = this
    super.TearDown()
  }

  //
  //
  // Runtime - Accessors - Events
  //
  EventName_didDismissView () {
    return 'EventName_didDismissView'
  }

  EventName_willDismissView () {
    return 'EventName_willDismissView'
  }

  EventName_willPresentInView () {
    return 'EventName_willPresentInView'
  }

  //
  //
  // Runtime - Accessors - Products
  //
  passwordTypeChosenWithPasswordIfNewPassword_orUndefined (withPassword) {
    const self = this
    switch (self.passwordEntryTaskMode) {
      case passwordEntryTaskModes.ForUnlockingApp_ExistingPasswordGivenType:
      case passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType:
      case passwordEntryTaskModes.ForAuthorizingAppAction:
        return undefined // we're going to allow this function to be called and simply return undefined because
        // the caller needs to pass it to a general purpose function
      case passwordEntryTaskModes.ForFirstEntry_NewPasswordAndType:
      case passwordEntryTaskModes.ForChangingPassword_NewPasswordAndType:
      case passwordEntryTaskModes.ForMigratingFromOldIOSVersion:
        return self.context.passwordController.DetectedPasswordTypeFromPassword(withPassword) // since we're not letting the user enter their pw type with this UI, let's auto-detect

      case passwordEntryTaskModes.None:
        throw 'passwordTypeChosenWithPasswordIfNewPassword_orUndefined called when self.passwordEntryTaskMode .None'
      default:
        throw 'This switch ought to have been exhaustive'
    }
  }

  //
  //
  // Runtime - Accessors - UI state
  //
  IsPresented () {
    const self = this
    const hasASuperview = typeof self.superview !== 'undefined' && self.superview !== null
    //
    return !!hasASuperview
  }

  //
  //
  // Runtime - Imperatives - Interface - Showing the view
  //
  GetUserToEnterExistingPasswordWithCB (
    root_tabBarViewAndContentView,
    isForChangePassword,
    isForAuthorizingAppActionOnly,
    customNavigationBarTitle_orNull,
    existingPasswordType,
    enterPassword_cb
    // TODO: add flag for whether this is for a change pw
  ) {
    const self = this
    if (isForChangePassword && isForAuthorizingAppActionOnly) {
      throw 'Illegal: isForChangePassword && isForAuthorizingAppActionOnly'
    }
    const shouldAnimateToNewState = isForChangePassword || isForAuthorizingAppActionOnly
    { // check legality
      if (self.passwordEntryTaskMode !== passwordEntryTaskModes.None) {
        throw 'GetUserToEnterExistingPasswordWithCB called but self.passwordEntryTaskMode not .None'
      }
    }
    { // we need to hang onto the callback for when the form is submitted
      self.enterPassword_cb = enterPassword_cb
    }
    { // put view into mode
      let taskMode
      if (isForChangePassword === true) {
        taskMode = passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType
      } else if (isForAuthorizingAppActionOnly) {
        taskMode = passwordEntryTaskModes.ForAuthorizingAppAction
      } else {
        taskMode = passwordEntryTaskModes.ForUnlockingApp_ExistingPasswordGivenType
      }
      self.passwordEntryTaskMode = taskMode
      //
      self._configureWithMode(shouldAnimateToNewState, customNavigationBarTitle_orNull)
    }
    self.presentIn__root_tabBarViewAndContentView(
      root_tabBarViewAndContentView,
      shouldAnimateToNewState
    )
  }

  GetUserToEnterNewPasswordAndTypeWithCB (
    root_tabBarViewAndContentView,
    isForChangePassword,
    enterPasswordAndType_cb
    // TODO: add flag for whether this is for a change pw
  ) {
    const self = this
    const shouldAnimateToNewState = isForChangePassword

    if (self.passwordEntryTaskMode !== passwordEntryTaskModes.None && 
      self.passwordEntryTaskMode !== passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType && 
      self.passwordEntryTaskMode !== passwordEntryTaskModes.ForMigratingFromOldIOSVersion) {
        throw 'GetUserToEnterNewPasswordAndTypeWithCB called but self.passwordEntryTaskMode not .None and not .ForChangingPassword_ExistingPasswordGivenType'
      }


    { // check legality
      if (self.passwordEntryTaskMode !== passwordEntryTaskModes.None && 
        self.passwordEntryTaskMode !== passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType && 
        self.passwordEntryTaskMode !== passwordEntryTaskModes.ForMigratingFromOldIOSVersion) {
          throw 'GetUserToEnterNewPasswordAndTypeWithCB called but self.passwordEntryTaskMode not .None and not .ForChangingPassword_ExistingPasswordGivenType'
        }
    }
    { // we need to hang onto the callback for when the form is submitted
      self.enterPasswordAndType_cb = enterPasswordAndType_cb
    }
    { // put view into mode
      let taskMode
      if (isForChangePassword === true) {
        taskMode = passwordEntryTaskModes.ForChangingPassword_NewPasswordAndType
      } else {
        taskMode = passwordEntryTaskModes.ForFirstEntry_NewPasswordAndType
      }
      // This series of if statements determines whether the user should be taken through the import process
      if (typeof(self.context.iosMigrationController) !== 'undefined') {
        const hasPreviouslyMigrated = self.context.iosMigrationController.hasPreviouslyMigrated;
        if (!hasPreviouslyMigrated) {
          const hasMigratableFiles = self.context.iosMigrationController.hasMigratableFiles;
          if (hasMigratableFiles) {
            taskMode = passwordEntryTaskModes.ForMigratingFromOldIOSVersion
          }
        }
      }

      self.passwordEntryTaskMode = taskMode
      //
      self._configureWithMode(
        shouldAnimateToNewState,
        null/* customNavigationBarTitle_orNull */
      )
    }
    self.presentIn__root_tabBarViewAndContentView(
      root_tabBarViewAndContentView,
      true // this is for NEW password, so we want this to show with an animation
      // because it's going to be requested after the user has already initiated activity
    )
  }

  //
  //
  // Runtime - Imperatives - Interface - Intra-task configuration
  //
  ReEnableSubmittingForm () {
    const self = this
    // TODO: would be nice to have a more rigorous way to address the current pw entry form view than 'topStackView'
    self.topStackView.ReEnableSubmittingForm()
  }

  ShowValidationErrorMessageToUser (err, orFallbackString) {
    const self = this
    let validationMessageString
    if (err) {
      if (err.message) {
        validationMessageString = err.message
      } else {
        console.warn('⚠️  Warning: err.message property of err was nil. typeof err:', typeof err, ', err:', err)
        validationMessageString = err.toString()
      }
    } else {
      validationMessageString = orFallbackString || '' // fallback
    }
    self._setValidationMessage(validationMessageString)
  }

  ClearValidationErrorMessage () {
    const self = this
    self._setValidationMessage('')
  }

  //
  //
  // Runtime - Imperatives - Interface - Dismissing the view
  //
  Dismiss (optl_isAnimated) {
    const self = this
    if (self.IsPresented() !== true) {
      console.warn("Asked to PasswordEntryView/Dismiss but can't as not presented. Bailing.")
      return
    }
    self.emit(self.EventName_willDismissView())
    { // clear state for next time
      self.passwordEntryTaskMode = passwordEntryTaskModes.None
    }
    { // clear both callbacks as well since we're no longer going to call back with either of the current values
      self.enterPassword_cb = null
      self.enterPasswordAndType_cb = null
    }
    const animate = optl_isAnimated !== false // default true
    if (self.modalParentView !== null) {
      self.modalParentView.DismissTopModalView(
        animate,
        function () {
          self.emit(self.EventName_didDismissView())
        }
      )
    }
  }

  //
  //
  // Runtime - Imperatives - Internal - Showing the view - Utilities
  //
  presentIn__root_tabBarViewAndContentView (
    root_tabBarViewAndContentView,
    optl__isAnimated
  ) {
    const self = this
    if (typeof self.modalParentView !== 'undefined' && self.modalParentView !== null) {
      console.warn('Asked to presentIn__root_tabBarViewAndContentView while already presented. Bailing.')
      return
    }
    {
      self.emit(self.EventName_willPresentInView())
    }
    const tabBarContentView_navigationView = root_tabBarViewAndContentView.CurrentlySelectedTabBarContentView()
    // ^- we know it's a stack & modal nav view
    const animate = optl__isAnimated === true // isAnimated dflt false
    tabBarContentView_navigationView.PresentView( // modally
      self,
      animate
    )
  }

  //
  //
  // Runtime - Imperatives - Internal - View configuration
  //
  _configureWithMode (shouldAnimate, customNavigationBarTitle_orNull) {
    const self = this
    if (typeof shouldAnimate === 'undefined') {
      shouldAnimate = false
    }
    const isForChangingPassword =
			self.passwordEntryTaskMode == passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType ||
			self.passwordEntryTaskMode == passwordEntryTaskModes.ForChangingPassword_NewPasswordAndType
    const isForAuthorizingAppActionOnly =
			isForChangingPassword == false &&
			self.passwordEntryTaskMode == passwordEntryTaskModes.ForAuthorizingAppAction
    //
    // we do not need to call self._clearValidationMessage() here because the ConfigureToBeShown() fns have the same effect
    { // transition to screen

      // This value gets set in SettingsController.js 
      if (self.context.shouldDisplayExistingPinScreenForMigration) {
        self.passwordEntryTaskMode = passwordEntryTaskModes.ForMigratingFromOldIOSVersion
      } 
      switch (self.passwordEntryTaskMode) {
        case passwordEntryTaskModes.ForUnlockingApp_ExistingPasswordGivenType:
        case passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType:
        case passwordEntryTaskModes.ForAuthorizingAppAction:
        case passwordEntryTaskModes.ForMigratingFromOldIOSVersion:
        {
          const enterExistingPasswordView = new EnterExistingPasswordView({
            isForChangingPassword: isForChangingPassword,
            isForAuthorizingAppActionOnly: isForAuthorizingAppActionOnly,
            customNavigationBarTitle_orNull: customNavigationBarTitle_orNull
          }, self.context)
          { // observation
            enterExistingPasswordView.on(
              enterExistingPasswordView.EventName_UserSubmittedNonZeroPassword(),
              function (password) {
                self.submitForm(password)
              }
            )
            enterExistingPasswordView.on(
              enterExistingPasswordView.EventName_CancelButtonPressed(),
              function () {
                self.Cancel(true)
              }
            )
          }
          self.SetStackViews([enterExistingPasswordView]) // i don't know of any cases where `animated` should be true - and there are reasons we don't want it to be - there's no 'old_topStackView'
          break
        }
        case passwordEntryTaskModes.ForFirstEntry_NewPasswordAndType:
        case passwordEntryTaskModes.ForChangingPassword_NewPasswordAndType:
        {

          const enterNewPasswordView = new EnterNewPasswordView({
            isForChangingPassword: isForChangingPassword
          }, self.context)
          { // observation
            enterNewPasswordView.on(
              enterNewPasswordView.EventName_UserSubmittedNonZeroPassword(),
              function (password) {
                self.submitForm(password)
              }
            )
            enterNewPasswordView.on(
              enterNewPasswordView.EventName_CancelButtonPressed(),
              function () {
                self.Cancel()
              }
            )
          }
          self.enterNewPasswordView = enterNewPasswordView
          if (self.stackViews.length == 0) {
            self.SetStackViews([enterNewPasswordView])
          } else {
            self.PushView(enterNewPasswordView, shouldAnimate)
          }
          break
        }
        case passwordEntryTaskModes.None:
        {
          throw '_configureWithMode called when self.passwordEntryTaskMode .None'
        }
        default:
        {
          throw 'This switch ought to have been exhaustive'
        }
      }
    }
  }

  _setValidationMessage (validationMessageString) {
    const self = this
    // TODO: would be nice to have a more rigorous way to address the current pw entry form view than 'topStackView'
    self.topStackView.SetValidationMessage(validationMessageString)
  }

  _clearValidationMessage () {
    const self = this
    self._setValidationMessage('')
  }

  //
  //
  // Runtime - Imperatives - Internal - Form management
  //
  async submitForm (password) {
    const self = this
    {
      self._clearValidationMessage()
    }
    let passwordType = self.passwordTypeChosenWithPasswordIfNewPassword_orUndefined(password)
    
    // Code for iOS migration
    if (self.context.deviceInfo.platform === 'ios') {
    // Ensuring that, if needed, we have a password type that corresponds to the migration process
      if (self.context.migrationFileData !== 'undefined' && self.context.iosMigrationController.migrationFilesExist) {
        // console.log("Override the password for the sake of this one-time migration");
        passwordType = "FreeformStringPW"
      }
    }

    // if iOS
    if (self.context.deviceInfo.platform === 'ios') {
      if (self.context.iosMigrationController.didPreviouslyMigrate === false && self.context.iosMigrationController.doesHaveMigratableFiles === true) {

        let keyForEncryptedString = Object.keys(self.context.iosMigrationController.migrationFileData)[0]
        let encryptedStringToAttemptDecrypt = self.context.iosMigrationController.migrationFileData[keyForEncryptedString].data

        symmetric_string_cryptor.New_DecryptedString__Async(encryptedStringToAttemptDecrypt, password, function(err, decryptedMessage) {
          if (err) {
            const errStr = self.context.passwordController._new_incorrectPasswordValidationErrorMessageString()
            //const err = new Error(errStr)
            self.context.passwordController.unguard_getNewOrExistingPassword()
            self.context.passwordController.emit(self.context.passwordController.EventName_ErroredWhileGettingExistingPassword(), err)
          } else {
            // We decrypted the message, so it's safe to continue
            self._passwordController_callBack_trampoline(
              false, // didCancel?
              password,
              passwordType
            )
          }
        });
      } else {
        // we don't need to check migration information since we already migrated in a previous migration process        
        self._passwordController_callBack_trampoline(
          false, // didCancel?
          password,
          passwordType
        )
      }// end if migrated in past
    } else { // end if iOS
      self._passwordController_callBack_trampoline(
        false, // didCancel?
        password,
        passwordType
      )  
    }    
  }

  Cancel (optl_isAnimated) {
    const isAnimated = optl_isAnimated !== false
    //
    const self = this
    self._passwordController_callBack_trampoline(
      true, // didCancel
      undefined,
      undefined
    )
    //
    function _really_Dismiss () {
      self.Dismiss(optl_isAnimated)
    }
    if (isAnimated !== true) {
      _really_Dismiss() // we don't want any delay - because that could mess with consumers'/callers' serialization
    } else {
      setTimeout(_really_Dismiss) // do on next tick so as to avoid animation jank
    }
  }

  async _passwordController_callBack_trampoline (didCancel, password_orNil, passwordType_orNil) {
    const self = this
    //
    // NOTE: we unfortunately can't just clear the callbacks here even though this is where we use them because
    // if there's a validation error, and the user wants to try again, there would be no callback through which
    // to submit the subsequent try
    //

    if (self.context.iosMigrationController !== "undefined") {
      self.passwordEntryTaskModes = passwordEntryTaskModes.ForMigratingFromOldIOSVersion;
    }
    switch (self.passwordEntryTaskMode) {
      case passwordEntryTaskModes.ForMigratingFromOldIOSVersion: {
        // Attempt to decrypt files and do migration business here
        let migrationController = self.context.iosMigrationController;

        var migrationPromiseArr = [];
        var i;

        try {
          self.enterPasswordAndType_cb(
            didCancel,
            password_orNil,
            passwordType_orNil
          )
        } catch (error) {
          self.enterPassword_cb(
            didCancel,
            password_orNil
          )  
        }
        // we don't want to free/zero the cb here - user may get pw wrong and try again
        break
      }
      case passwordEntryTaskModes.ForUnlockingApp_ExistingPasswordGivenType:
      case passwordEntryTaskModes.ForChangingPassword_ExistingPasswordGivenType:
      case passwordEntryTaskModes.ForAuthorizingAppAction:
      {
        { // validate cb state
          if (typeof self.enterPassword_cb === 'undefined' || self.enterPassword_cb === null) {
            throw 'PasswordEntryView/_passwordController_callBack_trampoline: missing enterPassword_cb for passwordEntryTaskMode: ' + self.passwordEntryTaskMode
          }
        }
        self.enterPassword_cb(
          didCancel,
          password_orNil
        )
        // we don't want to free/zero the cb here - user may get pw wrong and try again
        break
      }
      case passwordEntryTaskModes.ForFirstEntry_NewPasswordAndType:
      case passwordEntryTaskModes.ForChangingPassword_NewPasswordAndType:
      {
        { // validate cb state
          if (typeof self.enterPasswordAndType_cb === 'undefined' || self.enterPasswordAndType_cb === null) {
            throw 'PasswordEntryView/_passwordController_callBack_trampoline: missing enterPasswordAndType_cb for passwordEntryTaskMode: ' + self.passwordEntryTaskMode
          }
        }
        self.enterPasswordAndType_cb(
          didCancel,
          password_orNil,
          passwordType_orNil
        )
        // we don't want to free/zero the cb here - might trigger validation err & need to be called again
        break
      }
      case passwordEntryTaskModes.None:
        throw '_passwordController_callBack_trampoline called when self.passwordEntryTaskMode .None'
        //
      default:
        throw 'This switch ought to have been exhaustive'
    }
  }
}
export default PasswordEntryView
