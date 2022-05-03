'use strict'
import WebComponents from '@mymonero/mymonero-web-components'
import HostedMoneroAPIClient from '../../HostedMoneroAPIClient/HostedMoneroAPIClient'
import TXTRecordResolver from '../../OpenAlias/TXTResolver.web'
import Pasteboard from '../../Pasteboard/Pasteboard.browser'
import FilesystemUI from '../../FilesystemUI/FilesystemUI.browser'
import WindowDialogs from '../../WindowDialogs/WindowDialogs.browser'
import CcyConversionRates from '../../CcyConversionRates/Controller'
import ContactsListController from '../../Contacts/Controllers/ContactsListController'
import DocumentPersister from '../../DocumentPersister/DocumentPersister.SecureStorage'
import BackgroundAPIResponseParser from '@mymonero/mymonero-response-parser-utils'
import OpenAlias from '../../OpenAlias/OpenAliasResolver'
import FundsRequestsListController from '../../RequestFunds/Controllers/FundsRequestsListController'
import Passwords from '../../Passwords/Controllers/PasswordController.Full'
import Settings from '../../Settings/Controllers/SettingsController'
import UserIdle from '../../UserIdle/UserIdleInWindowController'
import WalletsList from '../../WalletsList/Controllers/WalletsListController.Full'
import WalletAppCoordinator from '../../WalletAppCoordinator/WalletAppCoordinator'
import ExceptionAlerting from '../Controllers/ExceptionAlerting.browser.web.js'

import { Browser } from '@capacitor/browser'

const txtRecordResolver = new TXTRecordResolver({})
function NewHydratedContext (initialContext) {
  initialContext = initialContext || {}

  const context = initialContext != null ? initialContext : {}

  context.pasteboard = new Pasteboard({}, context)
  context.filesystemUI = new FilesystemUI({}, context)
  context.windowDialogs = new WindowDialogs({}, context)
  context.CcyConversionRates_Controller_shared = new CcyConversionRates({}, context)
  context.persister = new DocumentPersister({}, context)
  context.backgroundAPIResponseParser = new BackgroundAPIResponseParser({
    coreBridge_instance: initialContext.monero_utils // the same as coreBridge_instance
  }, context)
  context.hostedMoneroAPIClient = new HostedMoneroAPIClient({
    appUserAgent_product: initialContext.name,
    appUserAgent_version: initialContext.version,
    apiUrl: initialContext.apiUrl,
    request_conformant_module: require('xhr')
  }, context)
  context.openAliasResolver = new OpenAlias({
    txtRecordResolver: txtRecordResolver
  }, context)
  context.passwordController = new Passwords({}, context)
  context.settingsController = new Settings({}, context)
  context.contactsListController = new ContactsListController({}, context)
  context.userIdleInWindowController = new UserIdle({}, context)
  context.walletsListController = new WalletsList({}, context)
  context.walletAppCoordinator = new WalletAppCoordinator({}, context)
  context.fundsRequestsListController = new FundsRequestsListController({}, context)
  context.exceptionAlerting = new ExceptionAlerting({}, context)

  const contextKeys = Object.keys(context)
  for (const i in contextKeys) {
    // It seems like the ES spread method used when invoking super in capacitorBrowser leads the following loop to believe that const postWholeContextInitSetupFn is defined, when it isn't
    const contextKey = contextKeys[i]
    const instance = context[contextKey]
    // This calls an optional function that classes can implement to get control after the whole context is set up
    const postWholeContextInitSetupFn = instance.RuntimeContext_postWholeContextInit_setup
    if (typeof postWholeContextInitSetupFn !== 'undefined') {
      postWholeContextInitSetupFn.call(instance) // using 'call' so the function's "this" is instance
    }
  }
  context.capacitorBrowser = Browser
  return context
}

const obj = {
  NewHydratedContext
}

export default obj
