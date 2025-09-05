const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('../prisma/prisma_lib.js'); // adjust path if needed

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          // add other fields as needed
        }
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));