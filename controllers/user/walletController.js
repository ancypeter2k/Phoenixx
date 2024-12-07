import walletModel from "../../models/wallet.js"

//^ //  //  //   //  //          GET WALLET PAGE    //  //  //  //  //  //  //

export const getWalletPage = async (req,res) => {
  try {
    const userID = req.session.userID

    const wallet = await walletModel.findOne({user:userID})

    if (!wallet) {
      return res.render('profile/wallet',{wallet:null,title:"Wallet"})
    }
    
    wallet.transaction.sort((a,b)=>b.transactionDate-a.transactionDate)

    res.render('profile/wallet',{wallet,title:"Wallet"})
  } catch (error) {
    console.error("error in get wallet page",error);
    res.status(500).send("internal server error in get wallet page")
  }
}