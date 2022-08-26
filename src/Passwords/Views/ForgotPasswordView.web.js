'use strict'

import View from '../../Views/View.web'
import commonComponents_emptyScreens from '../../MMAppUICommonComponents/emptyScreens.web'
import commonComponents_actionButtons from '../../MMAppUICommonComponents/actionButtons.web'

class ForgotPasswordView extends View {
  constructor (options, context) {
    super(options, context)
    const self = this
    {
      const userSelectedTypeOfPassword = self.context.passwordController.userSelectedTypeOfPassword
      if (userSelectedTypeOfPassword === null || userSelectedTypeOfPassword == '' || typeof userSelectedTypeOfPassword === 'undefined') {
        throw 'ConfigureToBeShown called but userSelectedTypeOfPassword undefined'
      }
      self.userSelectedTypeOfPassword = userSelectedTypeOfPassword
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
    self._setup_emptyStateMessageContainerView()
    self._setup_actionButtonsContainerView()
    { // update empty state message container to accommodate
      const margin_v = self.emptyStateMessageContainerView.__EmptyStateMessageContainerView_margin_v
      self.emptyStateMessageContainerView.layer.style.height =
				`calc(100% - ${2 * margin_v}px + 3px - ${self.actionButtonsContainerView.layer.style.height/* no'px' */})`
    }
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
    //
    layer.style.backgroundColor = '#272527' // so we don't get a strange effect when pushing self on a stack nav view
    //
    layer.style.color = '#c0c0c0' // temporary
    //
    layer.style.wordBreak = 'break-all' // to get the text to wrap
  }

  _setup_emptyStateMessageContainerView () {
    const self = this
    const view = commonComponents_emptyScreens.New_EmptyStateMessageContainerView(
      '😢',
      "Password reset is<br/>unfortunately not possible.<br/><br/>If you can't remember your password,<br/>you'll need to clear all data and<br/>re-import your wallet(s).",
      self.context,
      16,
      19 // and we'll set btm to 0 manually
    )
    const layer = view.layer
    layer.style.marginBottom = '0' // not going to use margin on the btm because action bar is there
    self.emptyStateMessageContainerView = view
    self.addSubview(view)
  }

  _setup_actionButtonsContainerView () {
    const self = this
    const margin_h = self.emptyStateMessageContainerView.__EmptyStateMessageContainerView_margin_h
    const margin_v = self.emptyStateMessageContainerView.__EmptyStateMessageContainerView_margin_v
    const view = commonComponents_actionButtons.New_Stacked_ActionButtonsContainerView(
      margin_h,
      margin_h,
      margin_v - 3,
      self.context
    )
    self.actionButtonsContainerView = view
    {
      self._setup_actionButton_nevermind()
      self._setup_actionButton_clearAllData()
    }
    self.addSubview(view)
  }

  _setup_actionButton_nevermind () {
    const self = this
    const buttonView = commonComponents_actionButtons.New_ActionButtonView(
      'Nevermind',
      null, // no image
      false,
      function (layer, e) {
        self.navigationController.PopView(true)
      },
      self.context
    )
    self.actionButtonsContainerView.addSubview(buttonView)
  }

  _setup_actionButton_clearAllData () {
    const self = this
    const buttonView = commonComponents_actionButtons.New_ActionButtonView(
      'Clear all data',
      null, // no image
      true,
      function (layer, e) {
        const msg = 'Are you sure you want to delete your wallet data?\n\nNo account information that links you to your wallets is retained by MyMonero. Recovery will only be possible by using your mnemonic seed. MyMonero does not retain personally identifiable data.'
        self.context.windowDialogs.PresentQuestionAlertDialogWith(
          'Delete all wallet and account data?',
          msg,
          'Delete Wallet and Account Data',
          'Cancel',
          function (err, didChooseYes) {
            if (err) {
              throw err
            }
            if (didChooseYes) {
              self.context.passwordController.InitiateDeleteEverything(function (err) {})
            }
          }
        )
      },
      self.context,
      undefined,
      'red' // 'destructive' cell
    )
    self.actionButtonsContainerView.addSubview(buttonView)
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
  }

  //
  //
  // Runtime - Accessors - Navigation
  //
  Navigation_Title () {
    const self = this
    const passwordType_humanReadableString = self.context.passwordController.HumanReadable_AvailableUserSelectableTypesOfPassword()[self.userSelectedTypeOfPassword]
    return 'Forgot ' + passwordType_humanReadableString + '?'
  }

  Navigation_New_LeftBarButtonView () {
    const self = this
    return null // no back btn
  }

  Navigation_HidesBackButton () {
    return true
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
export default ForgotPasswordView
