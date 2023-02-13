
'use strict'

import Swal from 'sweetalert2'
import { Clipboard } from '@capacitor/clipboard'

class ExceptionAlerting {
  constructor (options, context) {
    const self = this
    //
    self.options = options
    self.context = context
    //
    self.setup()
  }

  setup () {
    const self = this
    self._startObserving()
  }

  _startObserving () {
    const self = this
    window.onerror = function (message, file, line, col, error) {
      self.alertErrMsg(message, 1, error, file, line, col)
      return false
    }
    window.addEventListener('error', function (e) { // the nice thing about these errors 
      // Let's see if we can get the prototype of the error object
      let errorMessage = '';
      if (self.context.walletsListController.length == 0 
        && self.context.apiUrl.includes('mymonero.com') === FALSE) { 
        // There are approximately 1 in ~5000 users who have experienced issues with the automated iOS data migration. 
        // This is a workaround to attempt to allow those users to log in successfully
        // We explicitly warn the user that their API URL setting may be incorrect. 
        // We inform the user of what changing the URL for them implies for their view key privacy
        // We then change it to api.mymonero.com
        // The user's view-only key will be sent to mymonero.com. This would only be a privacy concern if they had previously used a custom URL in their settings
        errorMessage += `It looks like the iOS migration failed for your device, and that your API URL setting may be incorrect. \r\n
        MyMonero will try to recover from this behaviour by overriding your server URL to the mymonero server to attempt to work around the issue. 
        For standard users, this will not affect your privacy. If you use a custom server, please be aware that further login attempts
        will disclose your view-only keys to MyMonero. By default, this information would have already been supplied to MyMonero. 
        Please attempt to log in to restore your wallets, unless you only want to use a custom server.\r\n
        If you continue to experience issues, please contact MyMonero Support.`
          self.context.apiUrl = 'https://api.mymonero.com'
          self.alertErrMsg(errorMessage, 3, e)  
      }
      try {
        errorMessage += 'Instance of ' + Object.getPrototypeOf(e) + ' error - ';
      } catch (err) {
        errorMessage += 'Unable to determine prototype of error - ';
      }
      if (typeof(e.error) !== 'undefined' && typeof(e.error.message) !== 'undefined') {
        errorMessage += `Error type 2 w/ e.error.message: ${e.error.message}`
        self.alertErrMsg(errorMessage, 2, e, e.filename, e.lineno, e.colno)
      } else if (typeof(e.error) !== 'undefined'){
        errorMessage += `Error type 2 w/ e.error: ${e.error}`,
        self.alertErrMsg(errorMessage, 2, e, e.filename, e.lineno, e.colno)
      } else {
        errorMessage += `Error type 2 w/ e.error not defined: ${e}`
        self.alertErrMsg(errorMessage, 2, e, e.filename, e.lineno, e.colno)
      }
      return false
    })
    window.addEventListener('unhandledrejection', function (e) {
      let errorMessage = '';
      try {
        errorMessage += 'Instance of ' + Object.getPrototypeOf(e) + ' error - ';
      } catch (err) {
        errorMessage += 'Unable to determine prototype of error - ';
      }
      if (typeof(e) === 'PromiseRejectionEvent') {
        // Per MDN, PromiseRejectionEvent will have a `reason` property that we'll use for our alert. Filename, lineno and colno will be null
        errorMessage += `Errored promise: ${e.reason}`
        self.alertErrMsg(errorMessage, 3, e, e.filename, e.lineno, e.colno)
      } else { // e.error.message is not defined
        // a select few users are having issues that result in this error block being executed
        // we check to see if the user is logged in. If they aren't, we temporarily override the api authority URL in an attempt to fix the issue
        // Error checking will behave as normal if the user is logged in
        if (self.context.walletsListController.length > 0) { // don't change server url
          errorMessage += `Unexpected error encountered -- Non-browser-compliance error - we received an object other than a PromiseRejectionEvent: ${e}`
          self.alertErrMsg(errorMessage, 3, e)
        } else if (self.context.walletsListController.length == 0 
          && self.context.apiUrl.includes('mymonero.com') == FALSE) { 
          // There are approximately 1 in ~5000 users who have experienced issues with the automated iOS data migration. 
          // This is a workaround to attempt to allow those users to log in successfully
          // We explicitly warn the user that their API URL setting may be incorrect. 
          // We inform the user of what changing the URL for them implies for their view key privacy
          // We then change it to api.mymonero.com
          // The user's view-only key will be sent to mymonero.com. This would only be a privacy concern if they had previously used a custom URL in their settings
            errorMessage += `It looks like the iOS migration failed for your device, and that your API URL setting may be incorrect. \r\n
              MyMonero will try to recover from this behaviour by overriding your server URL to the mymonero server to attempt to work around the issue. 
              For standard users, this will not affect your privacy. If you use a custom server, please be aware that further login attempts
              will disclose your view-only keys to MyMonero. By default, this information would have already been supplied to MyMonero. 
              Please attempt to log in to restore your wallets, unless you only want to use a custom server.\r\n
              If you continue to experience issues, please contact MyMonero Support.`
            self.context.apiUrl = 'https://api.mymonero.com'
            self.alertErrMsg(errorMessage, 3, e)  
            
          } else {
            errorMessage += `Unexpected error encountered -- Non-browser-compliance error - we received an object other than a PromiseRejectionEvent: ${e}`
            self.alertErrMsg(errorMessage, 3, e)
          }
        // since these kinds of errors could be related to a network error, we'll attempt to continue execution
        return true
        // errors like this could be caused by a network error
      }
      return false
    })
  }

  //
  // Imperatives
  alertErrMsg (message, handlerId, errorObj, file = null, line = null, col = null) {
    // const self = this;
    // self.doToastMessage("Unhandled error. Please inform MyMonero Support of this message: " + message, message);
    // if (message.indexOf("undefined") !== -1 && message.indexOf("handler") !== -1) {
    // 	return // most likely an error from webflow - can skip erroring these ; TODO: remove this when removing webflow
    // }
    // if (typeof message !== 'undefined' && message && message !== "") {
    // 	self.doToastMessage("Unhandled error. Please inform MyMonero Support of this message: " + message, message);
    // } else {
    // 	self.doToastMessage("Unrecognized error occured. Please contact Support with steps and browser informations.", undefined)
    // }
    let errorHtml = `An unexpected application error occurred.\n\nPlease let us know of the following error message as it could be a bug:\n\n <p><span style='font-size: 11px;'>`
    errorHtml += `
      <p>File: ${file} <br>Line: ${line} <br>Col: ${col} <br>Message:
      <span style='font-size: 11px;'>${message}</span></p>
    `;
    errorHtml += '</span></p>'

    let errStr = `An unexpected application error occurred. The following error message was encountered: \n\n ${message}`
    errStr += `
      <p>File: ${file} <br>Line: ${line} <br>Col: ${col} <br>Message:
      <span style='font-size: 11px;'>${message}</span></p>
    `;
    // append stack trace to error we copy to clipboard

    if (typeof(errorObj.error) !== 'undefined' && typeof(errorObj.error.stack) !== 'undefined') {
      errStr += "Stack: " + errorObj.error.stack
    }
    errStr + " - " + navigator.userAgent

    Swal.fire({
      title: 'MyMonero has encountered an error',
      html: errorHtml,
      background: '#272527',
      color: '#FFFFFF',
      text: 'Do you want to continue',
      confirmButtonColor: '#11bbec',
      confirmButtonText: 'Copy Error To Clipboard',
      cancelButtonText: 'Close',
      showCloseButton: true,
      showCancelButton: true,
      preConfirm: async () => {
        // navigator.clipboard.writeText(errStr)
        await Clipboard.write({
          string: errStr
        })
      },
      customClass: {
        confirmButton: 'base-button hoverable-cell navigation-blue-button-enabled action right-save-button',
        cancelButton: 'base-button hoverable-cell navigation-blue-button-enabled action right-save-button disabled navigation-blue-button-disabled'
      }
    })
  }

  doToastMessage (message, raw_message) {
    const el = document.createElement('div')
    el.classList.add('exceptiontoast')
    el.appendChild(document.createTextNode(message)) // safely escape content
    document.body.appendChild(el)
    setTimeout(function () {
      el.classList.add('show')
      const finalRemoveDelay_s = animationDuration_s + displayDelay_s
      setTimeout(function () {
        el.classList.remove('show') // just so we can get the visibility:hidden in place -- probably not necessary
        el.parentNode.removeChild(el)
      }, finalRemoveDelay_s * 1000)
    })
  }
}
export default ExceptionAlerting
