import { Request, Response, NextFunction } from "express";
import { ProductTagService } from "../services/productTag.service";

const productTagService = new ProductTagService();

export class ProductTagController {

    replaceTagsForProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product_id = Number(req.params.product_id);
            const { tag_ids } = req.body;
            const result = await productTagService.replaceTagsForProduct(product_id, tag_ids);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    getTagsByProductId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product_id = Number(req.params.product_id);
            const tags = await productTagService.getTagsByProductId(product_id);
            res.status(200).json(tags);
        } catch (error) {
            next(error);
        }
    }
}