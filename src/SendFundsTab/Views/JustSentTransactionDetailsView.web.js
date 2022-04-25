'use strict'

import TransactionDetailsView from '../../Wallets/Views/TransactionDetailsView.web'

class JustSentTransactionDetailsView extends TransactionDetailsView {
  setup () {
    super.setup()
    const self = this
    // console.log("Just sent 'transaction'……", self.transaction)
    // TODO: implement the contact on tx here
  }
}
export default JustSentTransactionDetailsView
