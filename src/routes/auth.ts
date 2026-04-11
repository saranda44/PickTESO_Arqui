import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, register, me} from '../controllers/authController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureMessage: true }),
    googleCallback
);

router.post('/register', register);

// Test route to get current user info from JWT token

router.get('/me', authenticate, me);
// Only platform_admin can access this
router.get('/admin-only', authenticate, authorize('platform_admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome platform admin' });
});

// store_admin and platform_admin can access this
router.get('/store-only', authenticate, authorize('store_admin', 'platform_admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome store admin' });
});

export default router;