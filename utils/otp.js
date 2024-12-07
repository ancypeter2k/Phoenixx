import nodemailer from 'nodemailer'

export const generateOTP = () => {                                                          
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

export const sendOTPEmail = async (email, otp) => {                           // send otp to email
  const transporter = nodemailer.createTransport({                            // create email transporter
      service: 'Gmail', // your email service provider
      auth: {
          user: process.env.EMAIL_USER,                                       // your email address
          pass: process.env.EMAIL_PASS,                                       // your email password
      },
  });

  const mailOptions = {                                                       // set email options
      from: process.env.EMAIL_USER,                                           // sender's email address
      to: email,                                                              // recipient's email address
      subject: 'Your OTP Code',                                               // email subject
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,            // plain text body
  };

  await transporter.sendMail(mailOptions);                                    // send email
};
