
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
      //return false
    }
    window.addEventListener('error', function (e) { // the nice thing about these errors 
      self.alertErrMsg(e.error.message, 2, e, e.filename, e.lineno, e.colno)
      //return false
    })
    window.addEventListener('unhandledrejection', function (e) {
      self.alertErrMsg(e.error.message, 2, e, e.filename, e.lineno, e.colno)
      //return false
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

    if (typeof(errorObj.error.stack) !== 'undefined') {
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
