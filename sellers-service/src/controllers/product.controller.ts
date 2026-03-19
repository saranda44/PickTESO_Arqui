import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export class ProductController {

    createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const imageBuffer = req.file?.buffer;
            const product = await productService.createProduct(data, imageBuffer);
            res.status(201).json(product);
        } catch (error) {
            next(error);
        }
    }

    getProductById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.getProductById(id);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }

    updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const data = req.body;
            const imageBuffer = req.file?.buffer;
            const product = await productService.updateProduct(id, data, imageBuffer);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }

    deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            await productService.deleteProduct(id);
            res.status(200).json({ message: "Producto eliminado exitosamente." });
        } catch (error) {
            next(error);
        }
    }

    getProductsByStoreId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const store_id = Number(req.params.store_id);
            const products = await productService.getProductsByStoreId(store_id);
            res.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }

    getProductsWithTags = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const store_id = Number(req.params.store_id);
            if (isNaN(store_id) || store_id <= 0) {
                return res.status(400).json({ error: 'store_id inválido' });
            }
            const products = await productService.getProductsWithTags(store_id);
            res.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }
}