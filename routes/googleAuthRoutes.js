import express from 'express'
import passport from 'passport'
import checkUserSession from '../middleware/checkUserSession.js'

const router = express.Router()

//^  //  //  //  //  //  //                Google Auth routes                //  //  //  //  //  //  //

router.get('/auth/google',passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/login'}),
checkUserSession,
(req,res) => { 

  if(req.user.isBlocked) {
    req.flash('error','Your account has been blocked. Please contact Support.')
    return res.redirect('/login')
  }
  req.session.userID = req.user.id;
  req.session.name = req.user.name;
  res.redirect('/home')
 }
)

export default router