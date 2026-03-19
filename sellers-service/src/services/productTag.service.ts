import { IProductTag, ITag } from "../interfaces";
import { BadRequestError, NotFoundError } from "../errors";
import Repositories from "../repositories";

export class ProductTagService {

    // ----------------------------
    // AUXILIARY VALIDATION METHODS
    // ----------------------------

    private async productExists(product_id: number) {
        const product = await Repositories.product.findById(product_id);
        if (!product) throw new NotFoundError("El producto especificado no existe.");
    }

    private async tagExists(tag_id: number) {
        const tag = await Repositories.tag.findById(tag_id);
        if (!tag) throw new NotFoundError(`El tag ${tag_id} no existe.`);
    }

    // ---------------
    // PUBLIC METHODS
    // ---------------

    async replaceTagsForProduct(product_id: number, tag_ids: number[]): Promise<IProductTag[]> {
        if (tag_ids.length === 0) throw new BadRequestError("Debe proporcionar al menos un tag.");

        await this.productExists(product_id);

        for (const tag_id of tag_ids) {
            await this.tagExists(tag_id);
        }

        return await Repositories.productTag.replaceMany(product_id, tag_ids);
    }

    async getTagsByProductId(product_id: number): Promise<ITag[]> {
        await this.productExists(product_id);
        return await Repositories.productTag.findTagsByProductId(product_id);
    }
}