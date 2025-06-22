const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Member } = require('../models/member');
require('dotenv').config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);
      
      // Kiểm tra user đã tồn tại chưa
      let existingUser = await Member.findOne({ 
        $or: [
          { googleId: profile.id },
          { memberName: profile.emails[0].value }
        ]
      });

      if (existingUser) {
        // Nếu user đã tồn tại nhưng chưa có googleId, cập nhật
        if (!existingUser.googleId) {
          existingUser.googleId = profile.id;
          await existingUser.save();
        }
        return done(null, existingUser);
      }

      // Tạo user mới từ Google profile
      const newUser = new Member({
        googleId: profile.id,
        memberName: profile.emails[0].value,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        YOB: new Date().getFullYear() - 25, // Default age
        isAdmin: false,
        authProvider: 'google'
      });

      await newUser.save();
      console.log('New Google user created:', newUser);
      
      return done(null, newUser);
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Member.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;