import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db/clients';
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;

                if (!email) {
                    return done(new Error('No email found in Google profile'));
                }

                // Check if user exists in database
                const result = await pool.query(
                    `SELECT u.id, u.first_name, u.paternal_last_name, u.email, u.role, u.active,
                        s.id as store_id
                     FROM users u
                     LEFT JOIN stores s ON s.admin_id = u.id
                     WHERE u.email = $1`,
                    [email]
);

                const user = result.rows[0];

                if (!user) {
                    return done(null, false, { message: 'User not registered in the platform' });
                }

                if (!user.active) {
                    return done(null, false, { message: 'User account is inactive' });
                }

                return done(null, {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name, 
                    storeId: user.store_id ?? null,
                });

            } catch (error) {
                return done(error);
            }
        }
    )
);

export default passport;