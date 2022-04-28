import Utils from './ExchangeUtilityFunctions'

const validationMessages = document.getElementById('validation-messages')
const addressValidation = document.getElementById('address-messages')
const serverValidation = document.getElementById('server-messages')
const orderBtn = document.getElementById('order-button')
const loaderPage = document.getElementById('loader')

const exchangeXmrDiv = document.getElementById('exchange-xmr')
const backBtn = document.getElementsByClassName('nav-button-left-container')[0]
const XMRcurrencyInput = document.getElementById('XMRcurrencyInput')
const BTCcurrencyInput = document.getElementById('BTCcurrencyInput')
let currencyInputTimer

const BTCAddressInputListener = function () {
  const div = document.getElementById('btc-invalid')
  const btcAddressInput = document.getElementById('btcAddress')
  // console.log(Utils.validateBTCAddress(btcAddressInput.value))
  if ((Utils.validateBTCAddress(btcAddressInput.value) == false) && div == null) {
    const error = document.createElement('div')
    error.classList.add('message-label')
    error.id = 'btc-invalid'
    error.innerHTML = 'Your BTC address is not valid.'
    addressValidation.appendChild(error)
  } else {
    if (!(div == null)) {
      div.remove()
    }
  }
}

const walletSelectorClickListener = function (event) {
  const walletElement = document.getElementById('wallet-options')
  const selectedWallet = document.getElementById('selected-wallet')
  walletElement.classList.add('active')
  if (event.srcElement.parentElement.className.includes('optionCell')) {
    const dataAttributes = event.srcElement.parentElement.dataset
    selectedWallet.dataset.walletlabel = dataAttributes.walletlabel
    selectedWallet.dataset.walletbalance = dataAttributes.walletbalance
    selectedWallet.dataset.swatch = dataAttributes.swatch
    selectedWallet.dataset.walletselected = true
    selectedWallet.dataset.walletoffset = dataAttributes.walletoffset
    const walletLabel = document.getElementById('selected-wallet-label')
    const walletBalance = document.getElementById('selected-wallet-balance')
    const walletIcon = document.getElementById('selected-wallet-icon')
    walletElement.classList.remove('active')
    walletIcon.style.backgroundImage = `url('./assets/img/wallet-${dataAttributes.swatch}@3x.png'`
    walletLabel.innerText = dataAttributes.walletlabel
    walletBalance.innerText = dataAttributes.walletbalance + ' XMR'
    const walletSelector = document.getElementById('wallet-selector')
    walletSelector.dataset.walletchosen = true
    clearCurrencies()
  }
  if (event.srcElement.parentElement.className.includes('selectionDisplayCellView')) {
    walletElement.classList.add('active')
  }
  if (event.srcElement == 'div.hoverable-cell.utility.selectionDisplayCellView') {

  }
}

const CurrencyInputKeydownListener = function (event) {
  if (event.which == 8 || event.which == 110 || event.which == 46 || event.which == 190)
    {return;}

  if ((event.which >= 48 && event.which <= 57) || (event.which >= 96 && event.which <= 105)) {
    return
    }

  if (!Utils.checkDecimals(BTCcurrencyInput.value, 8)) {
    event.preventDefault()
        return;
  }
  event.preventDefault()
    
}

const xmrBalanceChecks = function (exchangeFunctions) {
  // console.log(exchangeFunctions)
  serverValidation.innerHTML = ''
  let BTCToReceive
  const XMRbalance = parseFloat(XMRcurrencyInput.value)
  const in_amount = XMRbalance.toFixed(12)
  // console.log(currencyInputTimer)
  BTCcurrencyInput.value = 'Loading...'
  if (currencyInputTimer !== undefined) {
    clearTimeout(currencyInputTimer)
  }
  if (exchangeFunctions.currentRates.in_min > XMRbalance) {
    const error = document.createElement('div')
    error.classList.add('message-label')
    error.id = 'xmrexceeded'
    error.innerHTML = `You cannot exchange less than ${exchangeFunctions.currentRates.in_min} XMR`
    validationMessages.appendChild(error)
    return
  }
  if (exchangeFunctions.currentRates.in_max < XMRbalance) {
    const error = document.createElement('div')
    error.classList.add('message-label')
    error.id = 'xmrexceeded'
    error.innerHTML = `You cannot exchange more than ${exchangeFunctions.currentRates.in_max} XMR`
    validationMessages.appendChild(error)
    return
  }
  validationMessages.innerHTML = ''
  serverValidation.innerHTML = ''
  currencyInputTimer = setTimeout(() => {
    exchangeFunctions.getOfferWithInAmount(exchangeFunctions.in_currency, exchangeFunctions.out_currency, in_amount)
      .then((response) => {
        // console.log('async return', response)
        BTCToReceive = parseFloat(response.out_amount)
        const selectedWallet = document.getElementById('selected-wallet')
        const tx_feeElem = document.getElementById('tx-fee')
        const tx_fee = tx_feeElem.dataset.txFee
        const tx_fee_double = parseFloat(tx_fee)
        const walletMaxSpendDouble = parseFloat(selectedWallet.dataset.walletbalance)
        const walletMaxSpend = walletMaxSpendDouble - tx_fee

        if ((walletMaxSpend - XMRbalance) < 0) {
          const error = document.createElement('div')
          error.classList.add('message-label')
          error.id = 'xmrexceeded'
          error.innerHTML = `You cannot exchange more than ${walletMaxSpend} XMR`
          validationMessages.appendChild(error)
        }
        if (BTCToReceive.toFixed(8) > exchangeFunctions.currentRates.out_max) {
          const error = document.createElement('div')
          error.classList.add('message-label')
          error.id = 'xmrexceeded'
          error.innerHTML = `You cannot exchange more than ${exchangeFunctions.currentRates.in_max.toFixed(12)} XMR`
          validationMessages.appendChild(error)
        }
        if (BTCToReceive.toFixed(8) < exchangeFunctions.currentRates.lower_limit) {
          const error = document.createElement('div')
          error.classList.add('message-label')
          error.id = 'xmrtoolow'
          error.innerHTML = `You cannot exchange less than ${exchangeFunctions.currentRates.in_min.toFixed(12)} XMR.`
          validationMessages.appendChild(error)
        }
        BTCcurrencyInput.value = BTCToReceive.toFixed(8)
      }).catch((error) => {
        const errorDiv = document.createElement('div')
        errorDiv.classList.add('message-label')
        errorDiv.id = 'server-invalid'
        errorDiv.innerHTML = 'There was a problem communicating with the server. <br>If this problem keeps occurring, please contact support with a screenshot of the following error: <br>' + error.message
        serverValidation.appendChild(errorDiv)
      })
  }, 1500)
}

const btcBalanceChecks = function (exchangeFunctions) {
  // console.log(exchangeFunctions)

  let BTCToReceive
  const BTCbalance = parseFloat(BTCcurrencyInput.value)
  const out_amount = BTCbalance.toFixed(12)
  XMRcurrencyInput.value = 'Loading...'
  if (currencyInputTimer !== undefined) {
    clearTimeout(currencyInputTimer)
  }

  if (exchangeFunctions.currentRates.out_min > BTCbalance) {
    const error = document.createElement('div')
    error.classList.add('message-label')
    error.id = 'xmrexceeded'
    error.innerHTML = `You cannot exchange less than ${exchangeFunctions.currentRates.out_min} BTC`
    validationMessages.appendChild(error)
    return
  }
  if (exchangeFunctions.currentRates.out_max < BTCbalance) {
    const error = document.createElement('div')
    error.classList.add('message-label')
    error.id = 'xmrexceeded'
    error.innerHTML = `You cannot exchange more than ${exchangeFunctions.currentRates.out_max} BTC`
    validationMessages.appendChild(error)
    return
  }
  validationMessages.innerHTML = ''
  serverValidation.innerHTML = ''
  currencyInputTimer = setTimeout(() => {
    exchangeFunctions.getOfferWithOutAmount(exchangeFunctions.in_currency, exchangeFunctions.out_currency, out_amount)
      .then((response) => {
        const XMRtoReceive = parseFloat(response.in_amount)
        const selectedWallet = document.getElementById('selected-wallet')
        const tx_feeElem = document.getElementById('tx-fee')
        const tx_fee = tx_feeElem.dataset.txFee
        const tx_fee_double = parseFloat(tx_fee)
        const walletMaxSpendDouble = parseFloat(selectedWallet.dataset.walletbalance)
        const walletMaxSpend = walletMaxSpendDouble - tx_fee
        // let BTCToReceive = XMRcurrencyInput.value * exchangeFunctions.currentRates.price;
        // let XMRbalance = parseFloat(XMRcurrencyInput.value);
        const BTCCurrencyValue = parseFloat(BTCcurrencyInput.value)

        if ((walletMaxSpend - XMRtoReceive) < 0) {
          const error = document.createElement('div')
          error.classList.add('message-label')
          error.id = 'xmrexceeded'
          error.innerHTML = `You cannot exchange more than ${walletMaxSpend} XMR`
          validationMessages.appendChild(error)
        }

        if (BTCCurrencyValue.toFixed(12) > exchangeFunctions.currentRates.upper_limit) {
          const error = document.createElement('div')
          error.id = 'xmrexceeded'
          error.classList.add('message-label')
          const btc_amount = parseFloat(exchangeFunctions.currentRates.upper_limit)
          error.innerHTML = `You cannot exchange more than ${btc_amount} BTC.`
          validationMessages.appendChild(error)
        }
        if (BTCCurrencyValue.toFixed(8) < exchangeFunctions.currentRates.lower_limit) {
          const error = document.createElement('div')
          error.id = 'xmrtoolow'
          error.classList.add('message-label')
          const btc_amount = parseFloat(exchangeFunctions.currentRates.lower_limit)
          error.innerHTML = `You cannot exchange less than ${btc_amount} BTC.`
          validationMessages.appendChild(error)
        }
        XMRcurrencyInput.value = XMRtoReceive.toFixed(12)
      }).catch((error) => {
        const errorDiv = document.createElement('div')
        errorDiv.classList.add('message-label')
        errorDiv.id = 'server-invalid'
        errorDiv.innerHTML = 'There was a problem communicating with the server. <br>If this problem keeps occurring, please contact support with a screenshot of the following error: <br>' + error.message
        serverValidation.appendChild(errorDiv)
      })
  }, 1500)
}

const backButtonClickListener = function () {
  const backBtn = document.getElementsByClassName('nav-button-left-container')[0]
  const viewOrderBtn = document.getElementById('view-order')
  orderCreated = false
  document.getElementById('orderStatusPage').classList.add('active')
  backBtn.style.display = 'none'
  const orderStatusDiv = document.getElementById('exchangePage')
  loaderPage.classList.remove('active')
  orderStatusDiv.classList.remove('active')
  exchangeXmrDiv.classList.remove('active')
  // console.log(viewOrderBtn)
  viewOrderBtn.style.display = 'block'
  // console.log(viewOrderBtn)
}

function clearCurrencies () {
  XMRcurrencyInput.value = ''
  BTCcurrencyInput.value = ''
}

// TODO: Finish refactoring this to clean up ExchangeScript.js
// orderBtnClickListener = function(orderStarted, ExchangeFunctions) {
//     let validationError = false;
//     if (orderStarted == true) {
//         return;
//     }
//     if (validationMessages.firstChild !== null) {
//         validationMessages.firstChild.style.color = "#ff0000";
//         validationError = true;
//         return;
//     }
//     if (addressValidation.firstChild !== null) {
//         addressValidation.firstChild.style.color = "#ff0000";
//         validationError = true;
//         return;
//     }
//     orderBtn.style.display = "none";
//     orderStarted = true;
//     backBtn.style.display = "block";
//     loaderPage.classList.add('active');
//     let amount = document.getElementById('XMRcurrencyInput').value;
//     let amount_currency = 'XMR';
//     let btc_dest_address = document.getElementById('btcAddress').value;
//     let test = ExchangeFunctions.createNewOrder(amount, amount_currency, btc_dest_address).then((response) => {
//         order = response.data;
//         orderCreated = true;
//     }).then((response) => {
//         backBtn.innerHTML = `<div class="base-button hoverable-cell utility grey-menu-button disableable left-back-button" style="cursor: default; -webkit-app-region: no-drag; position: absolute; opacity: 1; left: 0px;"></div>`;
//         orderTimer = setInterval(() => {
//             ExchangeFunctions.getOrderStatus().then(function (response) {
//                 Utils.renderOrderStatus(response);
//                 let expiryTime = response.expires_at;
//                 let secondsElement = document.getElementById('secondsRemaining');
//                 let minutesElement = document.getElementById('minutesRemaining');
//                 if (secondsElement !== null) {

//                     let minutesElement = document.getElementById('minutesRemaining');
//                     let timeRemaining = Utils.getTimeRemaining(expiryTime);
//                     minutesElement.innerHTML = timeRemaining.minutes;
//                     if (timeRemaining.seconds <= 9) {
//                         timeRemaining.seconds = "0" + timeRemaining.seconds;
//                     }
//                     secondsElement.innerHTML = timeRemaining.seconds;
//                     let xmr_dest_address_elem = document.getElementById('XMRtoAddress');
//                     xmr_dest_address_elem.value = response.receiving_subaddress;
//                 }
//             })
//         }, 1000);
//         document.getElementById("orderStatusPage").classList.remove('active');
//         let orderStatusDiv = document.getElementById("exchangePage");
//         loaderPage.classList.remove('active');
//         orderStatusDiv.classList.add('active');
//         exchangeXmrDiv.classList.add('active');
//     }).catch((error) => {
//         if (error.response) {
//             let errorDiv = document.createElement("div");
//             errorDiv.innerText = "An unexpected error occurred";
//             validationMessages.appendChild(errorDiv);
//         } else if (error.request) {
//             let errorDiv = document.createElement("div");
//             errorDiv.innerText = "XMR.to's server is unreachable. Please try again shortly.";
//             validationMessages.appendChild(errorDiv);
//         } else {
//             let errorDiv = document.createElement("div");
//             errorDiv.innerText = error.message;
//             validationMessages.appendChild(errorDiv);
//         }
//     });
// }

export default {
  BTCAddressInputListener,
  CurrencyInputKeydownListener,
  walletSelectorClickListener,
  xmrBalanceChecks,
  btcBalanceChecks
  // orderBtnClickListener
}
