import { IProduct, IProductWithTags } from "../interfaces";
import { NotFoundError } from "../errors";
import Repositories from "../repositories";

export class ProductService {

    async getById(id: number): Promise<IProduct> {
        const product = await Repositories.product.findById(id);
        if (!product) throw new NotFoundError("The specified product does not exist.");
        return product;
    }

    async getByStoreIdWithTags(storeId: number): Promise<IProductWithTags[]> {
        const store = await Repositories.store.findById(storeId);
        if (!store) throw new NotFoundError("The specified store does not exist.");
        return await Repositories.product.findByStoreIdWithTags(storeId);
    }
}