'use strict'

import SendFundsView_Base from './SendFundsView_Base.web'
import commonComponents_contactPicker from '../../MMAppUICommonComponents/contactPicker.web'
import monero_requestURI_utils from '@mymonero/mymonero-request-utils'
import AddContactFromSendTabView from '../../Contacts/Views/AddContactFromSendTabView.web'
import StackAndModalNavigationView from '../../StackNavigation/Views/StackAndModalNavigationView.web'

class SendFundsView extends SendFundsView_Base {
  startObserving () {
    const self = this
    super.startObserving() // must call
  }

  //
  // Overrides - Required - Setup - Accessors
  _new_required_contactPickerLayer () {
    const self = this
    const layer = commonComponents_contactPicker.New_contactPickerLayer(
      self.context,
      'Contact name, or address/domain',
      self.context.contactsListController,
      function (contact) { // did pick
        self._didPickContact(contact)
      },
      function (clearedContact) {
        self.cancelAny_requestHandle_for_oaResolution()
        //
        self._dismissValidationMessageLayer() // in case there was an OA addr resolve network err sitting on the screen
        self._hideResolvedPaymentID()
        self._hideResolvedAddress()
        //
        self.addPaymentIDButtonView.layer.style.display = 'block' // can re-show this
        self.manualPaymentIDInputLayer_containerLayer.style.display = 'none' // just in case
        self.manualPaymentIDInputLayer.value = ''
        //
        self.pickedContact = null
      },
      function (event) { // didFinishTypingInInput_fn
        self._didFinishTypingInContactPickerInput(event)
      }
    )
    return layer
  }

  //
  // Delegation - Internal
  _shared_didPickRequestConfirmedURIStringForAutofill (possibleUriString) {
    const self = this
    //
    self.validationMessageLayer.ClearAndHideMessage() // in case there was a parsing err etc displaying
    self._clearForm()
    //
    self.cancelAny_requestHandle_for_oaResolution()
    //
    let requestPayload
    try {
      requestPayload = monero_requestURI_utils.New_ParsedPayload_FromPossibleRequestURIString(possibleUriString, self.context.nettype, self.context.monero_utils)
    } catch (errStr) {
      if (errStr) {
        self.validationMessageLayer.SetValidationError('Unable to decode that URL: ' + errStr)
        return
      }
    }
    self._shared_havingClearedForm_didPickRequestPayloadForAutofill(requestPayload)
  }

}
export default SendFundsView
