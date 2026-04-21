import { Request, Response, NextFunction } from "express";
import { ForbiddenError, NotFoundError } from "../errors";
import Repositories from "../repositories";

type GetId = (req: Request) => number;

export const ownsStore = (getId: GetId) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const storeId = getId(req);
            const adminId = req.user!.id;

            const store = await Repositories.store.findById(storeId);
            if (!store) throw new NotFoundError("Tienda no encontrada.");
            if (Number(store.admin_id) !== adminId) throw new ForbiddenError("No tienes permisos.");

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const ownsProduct = (getId: GetId) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productId = getId(req);
            const adminId = req.user!.id;

            const product = await Repositories.product.findById(productId);
            if (!product) throw new NotFoundError("Producto no encontrado.");

            const store = await Repositories.store.findById(product.store_id);
            if (!store) throw new NotFoundError("Tienda no encontrada.");
            if (Number(store.admin_id) !== adminId) throw new ForbiddenError("No tienes permisos.");

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const ownsTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tagId = Number(req.params.id);
        const adminId = req.user!.id;

        const tag = await Repositories.tag.findById(tagId);
        if (!tag) throw new NotFoundError("Tag no encontrado.");

        const store = await Repositories.store.findById(tag.store_id);
        if (!store) throw new NotFoundError("Tienda no encontrada.");
        if (Number(store.admin_id) !== adminId) throw new ForbiddenError("No tienes permisos.");

        next();
    } catch (error) {
        next(error);
    }
};

export const ownsInventoryEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entryId = Number(req.params.id);
        const adminId = req.user!.id;

        const entry = await Repositories.inventory.findById(entryId);
        if (!entry) throw new NotFoundError("Entrada de inventario no encontrada.");

        const product = await Repositories.product.findById(entry.product_id);
        if (!product) throw new NotFoundError("Producto no encontrado.");

        const store = await Repositories.store.findById(product.store_id);
        if (!store) throw new NotFoundError("Tienda no encontrada.");
        if (Number(store.admin_id) !== adminId) throw new ForbiddenError("No tienes permisos.");

        next();
    } catch (error) {
        next(error);
    }
};