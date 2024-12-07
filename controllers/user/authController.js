import userModel from '../../models/User.js';
import bcrypt from 'bcrypt';
import { generateOTP, sendOTPEmail } from '../../utils/otp.js';
import categoryModel from '../../models/category.models.js';
import productModel from '../../models/product.models.js';


// // GET Login Page
export const getLogin = async (req, res) => {
  if (req.session.userID) {
    return res.redirect('/home');
  } else {
    res.render('user/userLogin');
  }
};

// // POST Login
export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFind = await userModel.findOne({ email });

    if (!userFind) {
      req.flash('error', "Please enter a valid email address");
      return res.redirect('/login');
    }

    if (userFind.isBlocked) {
      req.flash('error', 'Your account has been blocked. Please contact Support');
      return res.redirect('/login');
    }

    if (!userFind.isVerified) {
      req.flash('error', "Please verify your account before login");
      return res.redirect('/login');
    }

    const passwordMatch = await bcrypt.compare(password, userFind.password);
    if (!passwordMatch) {
      req.flash('error', "Please enter a valid password");
      return res.redirect('/login');
    } else {
      req.session.userID = userFind._id;
      req.session.name = userFind.name;
      return res.redirect('/home');
    }
  } catch (error) {
    console.log('Error during login:', error);
    res.send("internal server error")
  }
};

// // GET Home Page
export const getHome = async (req, res) => {
  try {
    res.redirect("/");
  } catch (error) {
    console.log('Error during getting home:', error);
    res.status(500).send("Internal server error");
  }
};

// // GET Signup Page
export const getSignup = async (req, res) => {
  try {
    res.render('user/userSignUp');
  } catch (error) {
    console.log('Error rendering signup page:', error);
  }
};

// // POST Signup
export const postSignup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
console.log(`req.body = ${email},${name}`);

    // Validation patterns
    const namePattern = /^(?! )[A-Za-z ]{4,}$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?!.*\s)[A-Za-z\d!@#$%^&*]{6,}$/;

    let error = '';
    if (!namePattern.test(name)) {
      error = "Name must be at least 4 characters long and contain only letters";
    } else if (!emailPattern.test(email)) {
      error = "Please enter a valid email address";
    } else if (!passwordPattern.test(password)) {
      error = "Password must be at least 6 characters long, include upper and lower case letters, a digit and a special character.";
    } else if (password !== confirmPassword) {
      error = "The passwords you entered do not match. Please try again.";
    }

    if (error) {
      console.log('Validation error:', error);
      return res.render('user/userSignUp', { error });
    }

    // Check if user already exists
    const userMatch = await userModel.findOne({ email });
    console.log(`user = ${userMatch}`);
    
    if (userMatch) {
      console.log('User already exists:', email);
      return res.render('user/userSignUp', { error: "User Already Exists" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Store user details and OTP in session temporarily until verification
    req.session.tempUser = {
      name,
      email,
      password,
      otp,
      otpExpiresAt
    };

    // Log OTP details
    console.log(`Generated OTP: ${otp} for email: ${email}`);

    // Send OTP to email
    await sendOTPEmail(email, otp);

    // Render OTP page with a success message
    res.render('user/otpSignup', { message: 'OTP sent to your email. Please check your email' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.render('user/userSignUp', { error: 'An error occurred during registration, please try again' });
  }
};

// // GET Verify OTP Page
export const getverifyOTP = (req, res) => {
  try {
    res.render('user/otpSignup');
  } catch (error) {
    console.log('Error rendering verify OTP page:', error);
  }
};

// //POST Verify OTP
export const postverifyOTP = async (req, res) => {
    try {
      const { otp } = req.body;
      const tempUser = req.session.tempUser;
  
      if (!tempUser) {
        req.flash('error', 'Session expired. Please sign up again.');
        return res.redirect('/signup');
      }
  
      const { name, email, password, otp: storedOtp, otpExpiresAt } = tempUser;
  
      if (otp !== storedOtp) {
        req.flash('error', 'Invalid OTP');
        return res.redirect('/verify-otp');
      }
  
      if (otpExpiresAt < new Date()) {
        req.flash('error', 'OTP has expired');
        return res.redirect('/verify-otp');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await userModel.create({
        name,
        email,
        password: hashedPassword,
        isVerified: true
      });
  
      delete req.session.tempUser;
  
      req.flash('success', 'Signup successful. Please login.');
      res.redirect('/login');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      req.flash('error', 'An error occurred during OTP verification. Please try again.');
      res.redirect('/verify-otp');
    }
  };
  
// // Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const tempUser = req.session.tempUser;

    if (!tempUser || !tempUser.email) {
      req.flash('error', "Session expired. Please signup again");
      return res.redirect('/signup');
    }

    const { name, email, password } = tempUser;

    const newOTP = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    req.session.tempUser = {
      name,
      email,
      password,
      otp: newOTP,
      otpExpiresAt
    };

    await sendOTPEmail(email, newOTP);

    req.flash('success', 'New OTP has been sent to your email');
    return res.redirect('/verify-otp');
  } catch (error) {
    console.log('Error resending OTP', error);
    req.flash('error', "Error sending OTP. Please try again");
    return res.redirect('/verify-otp');
  }
};

// // Logout
export const postLogout = async (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.log('Error during logout:', error);
    } else {
      res.redirect('/login');
    }
  });
};

// // GET Landing Page

export const getlandingPage=async(req,res)=>{

  try{

   //find the category list and sort them by createdAt in descending order
    const categorylist=await categoryModel.find({isBlocked:false}).sort({createdAt:-1})

    //find the latest product and populate the category details and sort them by createdAt in descending order and limit the result to 12
    const latestproduct=await productModel.find({isDeleted:false}).populate('category','name').sort({createdAt:-1}).limit(12)

    //render the home page with the category list and latest product
    res.render("user/home",{categorylist,latestproduct})

  }catch(error){

    console.log(error); 
    res.status(500).send("Internal server error")
  }
}
