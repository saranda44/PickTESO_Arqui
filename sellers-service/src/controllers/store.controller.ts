import { Request, Response, NextFunction } from "express";
import { StoreService } from "../services/store.service";

const storeService = new StoreService();

export class StoreController {

    createStore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const store = await storeService.createStore(data);
            res.status(201).json(store);
        } catch (error) {
            next(error);
        }
    }

    getStoreById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const store = await storeService.getStoreById(id);
            res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }

    getStoresByAdminId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const admin_id = Number(req.params.admin_id);
            const stores = await storeService.getStoresByAdminId(admin_id);
            res.status(200).json(stores);
        } catch (error) {
            next(error);
        }
    }

    updateStore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const data = req.body;
            const imageBuffer = req.file?.buffer;
            const store = await storeService.updateStore(id, data, imageBuffer);
            res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }

    deleteStore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            await storeService.softDeleteStore(id);
            res.status(200).json({ message: "Tienda eliminada exitosamente." });
        } catch (error) {
            next(error);
        }
    }
}