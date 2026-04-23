import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export class ProductController {

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.getById(id);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    };

    // getByStoreIdWithTags = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const storeId = Number(req.params.storeId);
    //         const products = await productService.getByStoreIdWithTags(storeId);
    //         res.status(200).json(products);
    //     } catch (error) {
    //         next(error);
    //     }
    // };
}