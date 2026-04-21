import { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service";

const inventoryService = new InventoryService();

export class InventoryController {

    createInventoryEntry = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const inventoryEntry = await inventoryService.createInventoryEntry(data);
            res.status(201).json(inventoryEntry);
        } catch (error) {
            next(error);
        }
    }

    deleteInventoryEntry = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            await inventoryService.deleteInventoryEntry(id);
            res.status(200).json({ message: "Entrada de inventario eliminada exitosamente." });
        } catch (error) {
            next(error);
        }
    }

    getInventoryEntriesByProductId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product_id = Number(req.params.product_id);
            const entries = await inventoryService.getInventoryEntriesByProductId(product_id);
            res.status(200).json(entries);
        } catch (error) {
            next(error);
        }
    }

    getStockByProductId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product_id = Number(req.params.product_id);
            const stock = await inventoryService.getStockByProductId(product_id);
            res.status(200).json({ product_id, stock });
        } catch (error) {
            next(error);
        }
    }
}