import Repositories from "../repositories";

import {
    User
} from '../interfaces/user.interface';

export class UserService {
    constructor() {}

    async getUserById(id: number): Promise<User | null> {
        return Repositories.user.findById(id);
    }
}