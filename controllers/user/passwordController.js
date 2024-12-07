import userModel from '../../models/User.js'
import bcrypt from 'bcrypt'
import { generateOTP, sendOTPEmail } from '../../utils/otp.js'


//^ //  //  //   //  //          getting Forgot Password page     //  //  //  //  //  //  //

export const getForgotPassword = async (req,res) => {
  try{
   
    res.render('user/forgotPassword')
  } catch(error) {
    console.log(error);
    res.status(500).send("Internal server Error")
  }
}


//^ //  //  //   //  //          post Forgot Password page     //  //  //  //  //  //  //

export const postForgotPassword = async (req,res) => {
  try{
    const {email} = req.body
    const user = await userModel.findOne( {email} )
    if(!user) {
      req.flash('error','User not found')
      return res.redirect('/forgotPassword')
    }
    if(user.isBlocked){
      req.flash('error',"your account has been blocked. Please Contact Support")
      return res.redirect('/forgotPassword')
    }

    // Generate a new OTP
    const otp =generateOTP()
    const otpExpiresAt =new Date(Date.now()+ 2 * 60 * 1000)

    // Store the email, OTP, and OTP expiration time in the session
    req.session.tempForgotPassword = {
      email,
      otp,
      otpExpiresAt
    }

    // Send the OTP to the user's email
    await sendOTPEmail(email,otp)
   
    // Redirect the user to the OTP verification page
    req.flash('success','OTP sent to your email.Please check your email')
    res.redirect('/verifyPasswordOtp')

  } catch(error) {
    console.log(error);
    req.flash('error',"An Error occurred during password reset. Please try again")
    res.redirect('/forgotPassword')

  }
}


//^ //  //  //   //  //        Get verify Forgot Password OTP page     //  //  //  //  //  //  //

export const getVerifyPasswordOTP =async (req,res) => {
  try{
   
    res.render('user/otpForgotPassword')

  }catch(error){
    console.log(error);
    res.status(500).send("Internal server Error")
  }
}


//^ //  //  //   //  //          Post verify Forgot Password OTP page     //  //  //  //  //  //  //

export const postVerifyPasswordOTP =async (req,res) => {
  try{
    const {otp} = req.body

    // Retrieve OTP details from the session (stored during the forgot password request)
    const tempForgotPassword = req.session.tempForgotPassword 

    if(!tempForgotPassword){
      req.flash('error','session expired. please try again')
      return res.redirect('/verifyPasswordOtp')
    }

    // Extract email, stored OTP, and OTP expiration time from session data
    const {email,otp:storedOTP,otpExpiresAt} = tempForgotPassword
    
    // Check if the entered OTP matches the stored OTP and is not expired
    if(otp !== storedOTP || otpExpiresAt < new Date()) {
      req.flash('error','invalid or expired otp')
      return res.redirect('/verifyPasswordOtp')
    }

    // Redirect to the reset password page with a success message
    req.flash('success','OTP verified successfully. Please reset your password')
    res.redirect('/resetPassword')


  } catch(error) {

    console.log(error);
    req.flash('error',"An Error occurred during verifying OTP. Please try again")
    res.redirect('/verifyPasswordOtp')

  }
}


//^ //  //  //   //  //          resend OTP          //  //  //  //  //  //  //

export const postresendOTP =async (req,res) => {
  try{
    const tempForgotPassword =req.session.tempForgotPassword

    if(!tempForgotPassword){
      req.flash('error','session expired. please try again')
      return res.redirect('/forgotPassword')
    }

    const {email} = tempForgotPassword

    const newOTP = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000)

    req.session.tempForgotPassword = {
      email,
      otp: newOTP,
      otpExpiresAt
    }

    await sendOTPEmail(email, newOTP)
    req.flash('success','New OTP has been sent to your email. Please check your email')
    res.redirect('/verifyPasswordOtp')

  } catch(error){
    console.log(error);
    req.flash('error','Error sending OTP. Please try again')
    res.redirect('/verifyPasswordOtp')

  }
}


//^ //  //  //   //  //          Get reset Password page     //  //  //  //  //  //  //

export const getResetPassword =async (req,res) => {
  try{
  
    res.render('user/resetPassword')
    
  } catch(error) {
    console.log(error);
    res.status.send('Internal server Error')
  }
}


//^ //  //  //   //  //          post reset Password page         //  //  //  //  //  //  //

export const postResetPassword =async (req,res) => {
  try{
    const {newPassword,confirmPassword} = req.body
 // validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!passwordPattern.test(newPassword)) {
      req.flash('error', 'Password must be at least 6 characters long, include upper and lower case letters, a digit, and a special character.');
      return res.redirect('/resetPassword')
    }

 // Check if the new password and confirm password match
    if(newPassword !== confirmPassword){
      req.flash('error',"The password you entered do not match.Please try again")
      return res.redirect('/resetPassword')
    }

 // Retrieve tempForgotPassword session data
    const tempForgotPassword = req.session.tempForgotPassword

    if(!tempForgotPassword){
      req.flash('error','session expired. please try again')
      return res.redirect('/resetPassword')
    }
 // Extract email from session data
    const {email} = tempForgotPassword

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user's password in the database
    await userModel.updateOne({email},{$set:{password:hashedPassword}})

    // Remove temporary session data after resetting the password
    delete req.session.tempForgotPassword

  
    // Redirect to the login page with a success message
    req.flash('success','Password reset successfully. Please login with your new password')
    res.redirect('/login')


  } catch(error) {
    console.log(error);
    req.flash('error',"Error reseting password. Please try again")
    res.redirect('/resetPassword')

  }
}