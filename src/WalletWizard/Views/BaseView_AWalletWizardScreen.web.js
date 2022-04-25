'use strict'

import View from '../../Views/View.web'
import commonComponents_forms from '../../MMAppUICommonComponents/forms.web'

class AddWallet_LandingScreenView extends View {
  constructor (options, context) {
    super(options, context)
    // console.log('AddWallet Landing Screen')
    const self = this
    {
      self.wizardController = self.options.wizardController
      if (self.wizardController == null || typeof self.wizardController === 'undefined') {
        throw self.constructor.name + ' requires a self.wizardController'
      }
    }
    self.setup()
  }

  setup () {
    const self = this
    self._setup_views()
    self._setup_startObserving()
  }

  _setup_views () {
    const self = this
    self.__setup_self_layer()
  }

  __setup_self_layer () {
    const self = this
    //
    const layer = self.layer
    layer.style.webkitUserSelect = 'none' // disable selection here but enable selectively
    //
    layer.style.position = 'relative'
    layer.style.boxSizing = 'border-box'
    layer.style.width = '100%'
    layer.style.height = '100%' // we're also set height in viewWillAppear when in a nav controller
    layer.style.padding = '0' // actually going to change paddingTop in self.viewWillAppear() if navigation controller
    layer.style.overflowY = 'auto'
    layer.classList.add( // so that we get autoscroll to form field inputs on mobile platforms
      commonComponents_forms.ClassNameForScrollingAncestorOfScrollToAbleElement()
    )
    // layer.style.webkitOverflowScrolling = "touch"
    //
    layer.style.backgroundColor = '#272527' // so we don't get a strange effect when pushing self on a stack nav view
    //
    layer.style.color = '#c0c0c0' // temporary
    //
    layer.style.wordBreak = 'break-all' // to get the text to wrap
  }

  _setup_startObserving () {
    const self = this
  }

  //
  //
  // Lifecycle - Teardown
  //
  TearDown () {
    const self = this
    super.TearDown()
    //
    self.wizardController = null // nil ref to ensure free
  }

  //
  //
  // Runtime - Accessors - Navigation
  //
  Navigation_Title () {
    const self = this
    throw 'override Navigation_Title in ' + self.constructor.name
    // return ""
  }
  //
  //
  // Runtime - Imperatives -
  //

  //
  //
  // Runtime - Delegation - Navigation/View lifecycle
  //
  viewWillAppear () {
    const self = this
    super.viewWillAppear()
    if (typeof self.navigationController !== 'undefined' && self.navigationController !== null) {
      self.layer.style.paddingTop = `${self.navigationController.NavigationBarHeight()}px`
    }
  }
}

export default AddWallet_LandingScreenView
