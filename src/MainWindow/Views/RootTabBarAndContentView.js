'use strict'

import TabBarAndContentView from '../../TabBarView/TabBarAndContentView.web'
import WalletsTabContentView from '../../WalletsList/Views/WalletsTabContentView.web'
import SendTabContentView from '../../SendFundsTab/Views/SendTabContentView.Full.web'
import RequestTabContentView from '../../RequestFunds/Views/RequestTabContentView.web'
import ContactsTabContentView from '../../Contacts/Views/ContactsTabContentView.web'
import SettingsTabContentView from '../../Settings/Views/SettingsTabContentView.web'
import ExchangeTabContentView from '../../Exchange/Views/ExchangeTabContentView.web'

class RootTabBarAndContentView extends TabBarAndContentView {
  setup () { // ^ called automatically by super, so
    const self = this
    super.setup() // must call this
    self._setup_views()
    self._setup_startObserving()
  }

  _setup_views () {
    const self = this
    {
      const layer = self.tabBarView.layer
      layer.style.background = '#171416'
      layer.id = "rootTabBarAndContentView";
    }
    {
      const layer = self.contentAreaView.layer
      layer.style.background = '#272527'
    }
    { // add tab bar content views
      self._setup_addTabBarContentViews()
    }
    function __passwordController_didBoot () {
      self.SetTabBarItemButtonsInteractivityNeedsUpdateFromProviders()
    }
    const passwordController = self.context.passwordController
    if (passwordController.hasBooted == true) {
      __passwordController_didBoot()
    } else {
      self.DisableTabBarItemButtons(true) // true: force-disable all while booting
      passwordController._executeWhenBooted(__passwordController_didBoot)
    }
  }

  _setup_addTabBarContentViews () {
    const self = this
    const context = self.context
    self.walletsTabContentView = new WalletsTabContentView({}, context)
    self.sendTabContentView = new SendTabContentView({}, context)
    self.requestTabContentView = new RequestTabContentView({}, context)
    self.contactsTabContentView = new ContactsTabContentView({}, context)
    self.exchangeTabContentView = new ExchangeTabContentView({}, context)
    self.settingsTabContentView = new SettingsTabContentView({}, context)

    self.SetTabBarContentViews(
      [
        self.walletsTabContentView,
        self.sendTabContentView,
        self.requestTabContentView,
        self.contactsTabContentView,
        self.exchangeTabContentView,
        self.settingsTabContentView
      ]
    )
  }

  _setup_startObserving () {
    const self = this
    { // passwordController
      const emitter = self.context.passwordController
      emitter.on(
        emitter.EventName_didDeconstructBootedStateAndClearPassword(),
        function () { // stuff like popping stack nav views to root views
          self.ResetAllTabContentViewsToRootState(false) // not animated
        }
      )
      emitter.on(
        emitter.EventName_havingDeletedEverything_didDeconstructBootedStateAndClearPassword(),
        function () {
          self.selectTab_wallets() // in case it was triggered by settings - if we didn't
          // select this tab it would look like nothing happened cause the 'enter pw' modal would not be popped as there would be nothing for the list controllers to decrypt
          self.SetTabBarItemButtonsInteractivityNeedsUpdateFromProviders() // disable some until we have booted again
        }
      )
    }
    { // walletsListController
      const emitter = self.context.walletsListController
      emitter.on(
        emitter.EventName_listUpdated(),
        function () { // if there are 0 wallets we don't want certain buttons to be enabled
          self.SetTabBarItemButtonsInteractivityNeedsUpdateFromProviders()
        }
      )
    }
    { // walletAppCoordinator
      const emitter = self.context.walletAppCoordinator
      emitter.on(
        emitter.EventName_willTrigger_sendFundsToContact(),
        function () {
          self.selectTab_sendFunds()
        }
      )
      emitter.on(
        emitter.EventName_willTrigger_requestFundsFromContact(),
        function () {
          self.selectTab_requestFunds()
        }
      )
      emitter.on(
        emitter.EventName_willTrigger_sendFundsFromWallet(),
        function () {
          self.selectTab_sendFunds()
        }
      )
    }
    { // drag and drop - stuff like tab auto-selection
      function _isAllowedToPerformDropOps () {
        if (self.context.passwordController.HasUserEnteredValidPasswordYet() === false) {
          // console.log("User hasn't entered valid pw yet")
          return false
        }
        if (self.context.passwordController.IsUserChangingPassword() === true) {
          // console.log('User is changing pw.')
          return false
        }
        if (!self.context.walletsListController.records || self.context.walletsListController.records.length == 0) {
          // console.log('No wallets.')
          return false
        }
        return true
      }
      self.layer.ondragover = function (e) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      let numberOfDragsActive = 0 // we need to keep a counter because dragleave is called for children
      self.layer.ondragenter = function (e) {
        e.preventDefault()
        e.stopPropagation()
        numberOfDragsActive++
        //
        if (numberOfDragsActive == 1) { // first time since started drag that entered self.layer - becomes 0 on real dragleave
          if (_isAllowedToPerformDropOps()) {
            const indexOf_sendTabContentView = self.IndexOfTabBarContentView(self.sendTabContentView)
            if (indexOf_sendTabContentView === self._currentlySelectedTabBarItemIndex) {
              // NOTE: we are not currently able to call self.selectTab_sendFunds below, because it causes
              // some sort of issue where, I'm guessing, when the current tab view is removed, it doesn't
              // fire its corresponding dragleave event, which means we never end up being able to disable
              // the drag drop zone cause we never receive the final numberOfDragsActive=0 dragleave. For that
              // reason we're only allowing a drag op to start when we're already on the Send tab
              // We might be able to solve this somehow but it didn't seem important enough in early stages -PS on 1/27/17
              //
              setTimeout(
                function () { // we must not manipulate the DOM in dragenter/start because that causes dragleave to fire immediately in Chrome.
                  // self.selectTab_sendFunds()
                  self.sendTabContentView._proxied_ondragenter(e)
                }
              )
            }
          } else { //
          }
        }
      }
      self.layer.ondragleave = self.layer.ondragend = function (e) {
        e.preventDefault()
        e.stopPropagation()

        numberOfDragsActive--
        //
        if (numberOfDragsActive == 0) { // back to 0 - actually left self.layer
          const indexOf_sendTabContentView = self.IndexOfTabBarContentView(self.sendTabContentView)
          if (indexOf_sendTabContentView === self._currentlySelectedTabBarItemIndex) {
            self.sendTabContentView._proxied_ondragleave(e)
          }
        }
        return false
      }
      self.layer.ondrop = function (e) {
        e.preventDefault()
        e.stopPropagation()
        numberOfDragsActive = 0 // reset just in case ondragleave wasn't properly fired due to some DOM manipulation or on drop. can happen.
        const indexOf_sendTabContentView = self.IndexOfTabBarContentView(self.sendTabContentView)
        if (indexOf_sendTabContentView === self._currentlySelectedTabBarItemIndex) {
          self.sendTabContentView._proxied_ondrop(e)
        }
        return false
      }
    }
  }

  _selectTab_withContentView (tabBarContentView) {
    const self = this
    const index = self.IndexOfTabBarContentView(tabBarContentView)
    self.SelectTabBarItemAtIndex(index)
  }

  selectTab_wallets () {
    const self = this
    self._selectTab_withContentView(self.walletsTabContentView)
  }

  selectTab_sendFunds () {
    const self = this
    self._selectTab_withContentView(self.sendTabContentView)
  }

  selectTab_requestFunds () {
    const self = this
    self._selectTab_withContentView(self.requestTabContentView)
  }

  selectTab_settings () {
    const self = this
    self._selectTab_withContentView(self.settingsTabContentView)
  }
}
export default RootTabBarAndContentView
