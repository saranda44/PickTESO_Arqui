import pool from "../config/db.config";
import { InventoryRepository } from "./inventory.repository";
import { ProductRepository } from "./product.repository";
import { ProductTagRepository } from "./productTag.repository";
import { StoreRepository } from "./store.repository";
import { TagRepository } from "./tag.repository";
import { UserRepository } from "./user.repository";

const poolInstance = pool;

const Repositories = {
    inventory: new InventoryRepository(poolInstance),
    product: new ProductRepository(poolInstance),
    productTag: new ProductTagRepository(poolInstance),
    store: new StoreRepository(poolInstance),
    tag: new TagRepository(poolInstance),
    user: new UserRepository(poolInstance),
};

export default Repositories;