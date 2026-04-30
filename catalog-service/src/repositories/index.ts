import pool from "../config/db.config";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "./product.repository";
import { StoreRepository } from "./store.repository";
import { UserRepository } from "./user.repository";

const poolInstance = pool;

const Repositories = {
    product: new ProductRepository(poolInstance),
    store: new StoreRepository(poolInstance),
    order: new OrderRepository(poolInstance),
    user: new UserRepository(poolInstance),
};

export default Repositories;