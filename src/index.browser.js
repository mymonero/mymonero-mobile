'use strict'

import './assets/css/styles.css'
import './assets/css/clear.browser.css'

import RootView from './MainWindow/Views/RootView' // electron uses .web files as it has a web DOM
import setup_utils from './MMAppRendererSetup/renderer_setup.browser'
import MyMoneroLibAppBridge from '@mymonero/mymonero-app-bridge'
import indexContextBrowser from './MainWindow/Models/index_context.browser'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Device } from '@capacitor/device'
import Swal from 'sweetalert2'

window.BootApp = async function () { // encased in a function to prevent scope being lost/freed on mobile
  const isDebug = false
  const version = '1.2.1'
  setup_utils({
    appVersion: version,
    reporting_processName: 'BrowserWindow'
  })

  const deviceInfo = await Device.getInfo()
  //
  // context
  MyMoneroLibAppBridge({}).then(function (coreBridge_instance) {
    const context = indexContextBrowser.NewHydratedContext({
      nettype: 0,
      apiUrl: 'api.mymonero.com',
      version: version,
      name: 'MyMonero',
      isDebug: isDebug,
      Cordova_isMobile: false, // (this can be renamed or maybe deprecated)
      appDownloadLink_domainAndPath: 'mymonero.com',
      HostedMoneroAPIClient_DEBUGONLY_mockSendTransactionSuccess: false,
      monero_utils: coreBridge_instance,
      deviceInfo: deviceInfo
    })

    window.MyMonero_context = context
    { // configure native UI elements
      document.addEventListener('touchstart', function () {}, true) // to allow :active styles to work in your CSS on a page in Mobile Safari:
      // disable tap -> click delay on mobile browsers
      const attachFastClick = require('fastclick')
      attachFastClick.attach(document.body)
    }
    { // root view
      const rootView = new RootView({}, context) // hang onto reference
      rootView.superview = null // just to be explicit; however we will set a .superlayer
      // manually attach the rootView to the DOM and specify view's usual managed reference(s)
      const superlayer = document.body
      rootView.superlayer = superlayer
      rootView.layer.id = 'rootView'
      superlayer.classList.add(`${deviceInfo.platform}`)
      superlayer.appendChild(rootView.layer) // the `layer` is actually the DOM element
    }
    { // and remove the loader (possibly fade this out)
      const el = document.getElementById('loading-spinner')
      el.parentNode.removeChild(el)
    }

    // URL handling -- we declare this here so as to ensure we have access to the context object
    App.addListener('appUrlOpen', async (URLOpenListenerEvent) => {

      // Handle our deep links here      
      let stringArr = URLOpenListenerEvent.url.split("eid=") // we split on eid= because we have "eid=" in the url

      if (stringArr.length > 1) { 

        let parameterStr = stringArr[1] 
        let parameterArr = parameterStr.split("&refresh_token=")
        let eid = decodeURIComponent(parameterArr[0])
        let refresh_token = decodeURIComponent(parameterArr[1])
        
        // rather than add a dependency for sanitising, we're going to do abort if we decode an opening tag
        if (eid.includes("<")) {
          return
        }
        if (refresh_token.includes("<")) {
          return
        } 

        if (typeof(context.walletsListController.addressToLink) === undefined) {
          console.error("Wallet to link to Yat is undefined"); // throw an error -- a wallet address wasn't specified
        } else {
          let walletIndex;          
          let matchedWalletReturnArray = context.wallets.filter((value, index) => { // This filter denotes the correct wallet record to map to the Yat
            if (value.eid === eid) { // We want to unset any prior Yat linkages
              value.eid = undefined;
            }
            if (value.public_address === context.walletsListController.addressToLink) { // If the public address matches, we know that this is the wallet the user selected to map
              walletIndex = index;
              return true
            }
          })

          if (typeof(walletIndex) == "number") { // Check that walletIndex is valid
            context.wallets[walletIndex].eid = eid;
            context.passwordController.yatRefreshToken = refresh_token;

            // The eid is received via URL. Swal sanitizes it
            let messageText = 'You have successfully linked `' + eid + '` to wallet ' + context.wallets[walletIndex].walletLabel;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Yat successfully linked',
              text: messageText,
              background: '#272527',
              titleColor: '#FFFFFF',
              color: '#FFFFFF',
              showConfirmButton: false,
              timer: 4500
            })
          }
        }
      }

      // conditional logic for (one day) handling monero:// links
      if (deviceInfo.platform === 'android') {

      } else if (deviceInfo.platform === 'ios') {  

      } else { // web
        // Not implemented
      }
      
      if (URLOpenListenerEvent.url.indexOf("monero://") !== -1 || URLOpenListenerEvent.url.indexOf("mymonero://") !== -1) {
        // We have a monero address
        // stubbed for processing protocol links
      }  
    })
  }).catch(function (e) {
    throw e
  })
  window.addEventListener('ionBackButton', (event) => {
    event.detail.register(10, () => {
      App.exitApp()
    })
  })
}
window.BootApp()

// Add event listener for exit
document.addEventListener('deviceready', onDeviceReady, false)

function onDeviceReady () {
  
  App.addListener('backButton', (event) => {
    App.exitApp()
  })

  App.addListener('appUrlOpen', async (URLOpenListenerEvent) => {
    // TODO: Finish writing this functionality
    // Handle our deep links here
    const deviceInfo = await Device.getInfo()
    let stringArr = URLOpenListenerEvent.url.split("eid=")
    if (stringArr.length > 1) { // we split on eid= because we have "eid=" in the url
    
      let parameterStr = stringArr[1] 
      let parameterArr = parameterStr.split("&refresh_token=")
      let eid = parameterArr[0]
      let refreshToken = parameterArr[1]

    
    }
    // conditional logic for (one day) handling monero:// links
    if (deviceInfo.platform === 'android') {
      // Yat returns users to us with URL parameters in order: 1st - eid=, 2nd - refresh_token=
      

    } else if (deviceInfo.platform === 'ios') {

    } else { // web
      // Not implemented
    }
    if (URLOpenListenerEvent.url.indexOf('monero://') !== -1 || URLOpenListenerEvent.url.indexOf('mymonero://') !== -1) {
      // We have a monero address
    }

    // Probably Yat, let's check
    if (URLOpenListenerEvent.url.indexOf('monero://') !== -1) {

    }
  })
}
