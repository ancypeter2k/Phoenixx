Phoenix Watches E-commerce App
This is a full-stack web application for an online watch store. It allows users to browse, purchase, and review watches while providing an admin dashboard for managing products, categories, users, sales reports, and more.

Features
User Side:

Browse and search for watches by category (Luxury, Casual, Sport).
User authentication (sign up, log in, reset password).
Manage user profile, orders, and wishlist.
Add watches to the shopping cart and proceed with secure checkout.
Apply discount coupons during checkout.

Admin Side:

Manage products (add, edit, delete).
Manage categories, coupons, and sales reports.
View and manage user list.
Access detailed sales analytics and reports.

PHOENIX_WATCHES/
│
├── app.js                            # Main application configuration
├── server.js                         # Starts the Express server
│   
├── config/                           # Configuration files
│   ├── db.js                         # MongoDB connection configuration
│   ├── cloudinary.js                 # Cloudinary configuration
│   └── passport.js                   # Passport configuration
│   
├── controllers/                      # Logic for handling routes
│   ├── admin/                        # Admin-specific controllers
│   │   ├── adminAuthController.js    # Admin authentication logic
│   │   ├── dashboardController.js     # Admin dashboard logic
│   │   ├── productController.js       # Product management logic
│   │   ├── categoryController.js      # Category management logic
│   │   ├── couponController.js        # Coupon management logic
│   │   ├── offerController.js         # Offer management logic
│   │   ├── salesReportController.js   # Sales report generation logic
│   │   └── userController.js          # User management logic from admin side
│   │
│   ├── user/                          # User-specific controllers
│   │   ├── authController.js          # User authentication logic
│   │   ├── productController.js       # Product-related logic for users
│   │   ├── cartController.js          # Cart management logic
│   │   ├── orderController.js         # Order processing logic
│   │   └── profileController.js       # User profile management logic
│
├── middleware/                       # Middleware for authentication, error handling, etc.
│   ├── adminMiddleware.js             # Handles authentication and authorization for Admin
│   ├── userMiddleware.js              # Handles authentication and authorization for User
│   ├── checkUserSession.js            # Checks user session
│   ├── multerMiddleware.js             # Middleware for file uploads
│   └── errorMiddleware.js             # Error handling middleware
│  
├── uploads/                          # Temporary storage for multer before files are uploaded to Cloudinary
│
├── models/                           # MongoDB schemas
│   ├── User.js                       # User schema
│   ├── Admin.js                      # Admin schema
│   ├── Product.js                    # Product schema
│   ├── Category.js                   # Category schema
│   ├── Coupon.js                     # Coupon schema
│   ├── Order.js                      # Order schema
│   ├── Cart.js                       # Cart schema
│   └── ...                           # Other schemas as needed
│   
├── public/                           # Publicly accessible files (e.g., CSS, JS, images)
│   ├── css/                          # CSS files
│   ├── js/                           # JavaScript files
│   └── images/                       # Image assets
│   
├── routes/                           # Route definitions
│   ├── adminRoutes.js                # Admin-specific routes
│   ├── userRoutes.js                 # User-specific routes
│   └── ...                           # Other routes as needed
│   
├── utils/                            # Utility functions
│   ├── Otp.js                        # Email utilities for OTP and notifications
│   └── ...                           # Other utility functions
│   
├── views/                            # EJS templates
│   ├── admin/                        # Admin-specific views
│   │   ├── adminLogin.ejs            # Admin login page
│   │   ├── addCategory.ejs           # Add category page
│   │   ├── editCategory.ejs          # Edit category page
│   │   ├── dashboard.ejs             # Admin dashboard
│   │   ├── productList.ejs           # Product management view
│   │   ├── addProducts.ejs           # Add products page
│   │   ├── editProducts.ejs          # Edit products page
│   │   ├── sidebar.ejs               # Sidebar for all admin pages (like partials)
│   │   ├── category.ejs              # Category management view
│   │   ├── coupons.ejs               # Coupon management view
│   │   ├── salesReport.ejs           # Sales report view
│   │   ├── offers.ejs                # Offer management view
│   │   └── userList.ejs              # User list management view
│   │   
│   ├── user/                         # User-specific views
│   │   ├── userLogin.ejs             # User login page
│   │   ├── userSignUp.ejs            # User signup page
│   │   ├── otp.ejs                   # OTP verification page
│   │   ├── forgetPassword.ejs        # Forgot password page
│   │   ├── resetPassword.ejs         # Reset password page
│   │   ├── index.ejs                 # Homepage
│   │   ├── productDetails.ejs        # Product details page
│   │   ├── cart.ejs                  # Cart view
│   │   └── profile.ejs               # User profile view
│   │   
│   ├── layouts/                      # Layout for admin and user (express-ejs-layout)
│   │   └── layout.ejs                # Main layout file
│   │   
│   └── partials/                     # Reusable EJS partials (e.g., header, footer)
│       ├── header.ejs                # Header partial
│       └── footer.ejs                # Footer partial
│   
├── .env                              # Environment variables
├── .gitignore                        # Git ignore file
├── README.md                         # Project documentation
└── package.json                      # NPM dependencies and scripts

Packages Used
│
├── Dependencies
│   ├── bcrypt                     # For hashing passwords.
│   ├── cloudinary                 # For image storage and management.
│   ├── dotenv                     # For managing environment variables.
│   ├── ejs                        # For templating.
│   ├── express                    # Web framework for Node.js.
│   ├── express-ejs-layouts        # Middleware for EJS layout support.
│   ├── express-session             # For session management.
│   ├── mongoose                   # MongoDB object modeling for Node.js.
│   ├── morgan                     # HTTP request logger middleware for Node.js.
│   ├── multer                     # Middleware for handling file uploads.
│   ├── nocache                    # Middleware to prevent caching.
│   ├── nodemailer                 # For sending emails (e.g., for OTPs).
│   ├── passport                   # Middleware for authentication.
│   ├── passport-google-oauth20    # Google OAuth 2.0 authentication strategy for Passport.
│   └── uuid                       # For generating unique identifiers.
│
└── DevDependencies
    └── nodemon                    # Tool for automatically restarting the Node.js application when file changes are detected.
