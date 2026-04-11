import { JwtPayload } from '../middlewares/auth';

declare global {
    namespace Express {
        interface User extends JwtPayload {}
        interface Request {
            user?: JwtPayload;
        }
    }
}