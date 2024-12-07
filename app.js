// // // // importing the required modules // // // //
import express from 'express';
import session from "express-session";
import expressLayouts from "express-ejs-layouts";
import dotenv from 'dotenv';
import path from "path";
import multer from 'multer';
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import flash from "connect-flash";
import morgan from 'morgan';
import nocache from "nocache";
import passport from './config/passport.js';

// // // // Load environment variables // // // //
dotenv.config();

// // // // Database connection // // // //
connectDB();

// // // // Initialize Express app // // // //
const app  = express()

// // // // importing the required routes // // // //
import adminRoutes from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js'
import googleAuthRouter from './routes/googleAuthRoutes.js'

// // directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// // // // Set template engine // // // //
app.set('view engine','ejs');                                                              
app.set('views',path.join(__dirname,'views'));

// // // // Middleware // // // //
app.use(express.json());                                                                        //parse json
app.use(express.urlencoded({extended:true}));                                                  //parse urlencoded
app.use(express.static(path.join(__dirname,'public')));                                         //set public directory
app.use(morgan('dev'));

// // // // Use express-ejs-layouts middleware // // // //
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// // // //  nocache // // // //
app.use(nocache())

// // // // session middleware // // // //
app.use(session({                                                                            
  secret:process.env.SESSION_SECRET, 
  resave:false,
  saveUninitialized: true,
  cookie:{maxAge:1000*60*60*24,secure:false},
}));

// // // // flash middleware // // // //
app.use(flash());

app.use((req,res,next)=>{
  res.locals.success=req.flash('success')
  res.locals.error=req.flash('error')
  next()
})

app.use((req, res, next) => {
  res.locals.flashMessage = req.session.flashMessage;
  delete req.session.flashMessage; 
  next();
});

app.use(passport.initialize())
app.use(passport.session())

// // // // routes // // // //
app.use('/admin',adminRoutes);
app.use('/',userRouter);
app.use('/',googleAuthRouter);

// // // // 404 Error // // // //
app.use('*',(req,res)=>{
  res.render('user/404');
});

// // // // 500 Error // // // //
app.use('*',(req,res)=>{
  res.render('user/500');
});

export default app