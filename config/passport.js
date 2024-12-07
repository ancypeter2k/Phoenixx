import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await userModel.findOne({ email: profile.emails[0].value });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      done(null, user);
    } else {
      const newUser = await userModel.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
      });
      done(null, newUser);
    }
  } catch (error) {
    done(error, false, { message: 'Error from Google' });
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

console.log("Passport Google strategy initialized");

export default passport;