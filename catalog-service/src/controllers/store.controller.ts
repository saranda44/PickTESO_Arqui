import { Request, Response, NextFunction } from "express";
import { StoreService } from "../services/store.service";

const storeService = new StoreService();

export class StoreController {

    getAll = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const stores = await storeService.getAll();
            res.status(200).json(stores);
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const store = await storeService.getById(id);
            res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    };
}