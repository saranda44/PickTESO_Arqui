import pool from "../config/db.config";
import { ProductRepository } from "./product.repository";
import { StoreRepository } from "./store.repository";

const poolInstance = pool;

const Repositories = {
    product: new ProductRepository(poolInstance),
    store: new StoreRepository(poolInstance),
};

export default Repositories;