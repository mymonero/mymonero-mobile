'use strict'

import commonComponents_forms from './forms.web'

function New_contactPickerLayer_Lite (
  context,
  placeholderText,
  didFinishTypingInInput_fn // ((event) -> Void)?
) //  -> Component (which is just a customized DOM element obj)
{ // NOTE: You must be able (the interface must exist) to call Component_TearDown when you're done with this component to comply with the Full contact picker
  //
  const containerLayer = document.createElement('div')
  containerLayer.classList.add('contactPicker_Lite')
  containerLayer.style.position = 'relative'
  containerLayer.style.width = '100%'
  containerLayer.style.webkitUserSelect = 'none' // disable selection
  containerLayer.style.MozUserSelect = 'none'
  containerLayer.style.msUserSelect = 'none'
  containerLayer.style.userSelect = 'none'
  //
  const inputLayer = _new_inputLayer(placeholderText, context)
  containerLayer.ContactPicker_inputLayer = inputLayer // so it can be accessed by consumers who want to check if the inputLayer is empty on their submission
  containerLayer.appendChild(inputLayer)
  { // observation of inputLayer
    let isFocused = false
    const hideResultsOnBlur_timeout = null
    inputLayer.addEventListener(
      'blur',
      function (event) {
        isFocused = false
      }
    )
    inputLayer.addEventListener(
      'focus',
      function (event) {
        isFocused = true
        inputLayer.Component_ScrollIntoViewInFormContainerParent()
      }
    )
    inputLayer.Component_ScrollIntoViewInFormContainerParent = function () { // this could also be called on window resize
      const this_layer = this
      commonComponents_forms._shared_scrollConformingElementIntoView(this_layer)
    }
    let typingDebounceTimeout = null
    function _inputLayer_receivedInputOrChanged (optl_event) {
      //
      // timeout-clearing key pressed
      if (typingDebounceTimeout !== null) {
        clearTimeout(typingDebounceTimeout)
      }
      const this_inputLayer = this
      typingDebounceTimeout = setTimeout(function () { // to prevent searching too fast
        typingDebounceTimeout = null // clear for next
        //
        if (didFinishTypingInInput_fn) {
          didFinishTypingInInput_fn(optl_event)
        }

        // _searchForAndDisplaySearchResults() // there isn't this call in .Lite.
      }, 350)
    }
    inputLayer.addEventListener(
      'input',
      function () {
        _inputLayer_receivedInputOrChanged(undefined) // this might seem redundant and/or to race with "keyup" but it doesn't affect _inputLayer_receivedInputOrChanged
      }
    )
    inputLayer.addEventListener(
      'change', // try to catch paste on as many platforms as possible
      function () {
        _inputLayer_receivedInputOrChanged(undefined) // this might seem redundant and/or to race with "keyup" but it doesn't affect _inputLayer_receivedInputOrChanged
      }
    )
    inputLayer.addEventListener(
      'keyup',
      function (event) {
        const code = event.code
        const wasEscapeKey = code == 'Escape' || event.keyCode == 27 /* should we use keyCode? */
        if (wasEscapeKey) { // toggle search results visibility
          // TODO: clear input? esp if esc hit twice?
          return // think it's ok to just return here and not mess with the typingDebounceTimeout
        }
        const wasOnlyModifierKey = code.indexOf('Meta') != -1 || code.indexOf('Alt') != -1 || code.indexOf('Control') != -1
        if (wasOnlyModifierKey) {
          // console.log('Input was only modifier key. Ignoring.')
          return
        }
        _inputLayer_receivedInputOrChanged(event)
      }
    )
  }
  containerLayer.ContactPicker_unpickExistingContact_andRedisplayPickInput = function (andDoNotFocus) { /* noOp */ } // Present here b/c we must maintain the same interface!!
  //
  // imperatives
  containerLayer.Component_TearDown = function () {
    // console.log('♻️  Tearing down (Lite) contacts picker.')
  }
  //
  return containerLayer
}

//
function _new_inputLayer (placeholderText, context) {
  const layer = commonComponents_forms.New_fieldValue_textInputLayer(context, {
    placeholderText: placeholderText
  })
  return layer
}

export default { New_contactPickerLayer_Lite }
