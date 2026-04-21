import {
    ICreateInventoryDTO,
} from "../dtos/inventory.dtos";
import { BadRequestError } from "../errors";
import Repositories from "../repositories";

export class InventoryService {


    // ----------------------------
    // AUXILIARY VALIDATION METHODS
    // ----------------------------

    private async productExists(productId: number) {
        const product = await Repositories.product.findById(productId);

        if (!product) {
            throw new BadRequestError("El producto especificado no existe.");
        }
    }

    private async stockSufficient(productId: number, quantity: number) {

        const stock = await Repositories.inventory.findStockByProductId(productId);

        if (stock - quantity < 0) {
            throw new BadRequestError("Stock insuficiente para realizar el movimiento de salida.");
        }
    }


    // ---------------
    // PUBLIC METHODS
    // ---------------

    async createInventoryEntry(data: ICreateInventoryDTO) {

        await this.productExists(data.product_id);

        if (data.movement_type === 'out') {
            await this.stockSufficient(data.product_id, data.quantity);
        }

        const inventoryEntry = await Repositories.inventory.create(data);

        return inventoryEntry;
    }


    async deleteInventoryEntry(id: number) {

        const entry = await Repositories.inventory.findById(id);

        if (!entry) {
            throw new BadRequestError("La entrada de inventario especificada no existe.");
        }

        const success = await Repositories.inventory.delete(id);

        return success;
    }


    async getInventoryEntriesByProductId(product_id: number) {

        await this.productExists(product_id);

        const entries = await Repositories.inventory.findEntriesByProductId(product_id);

        return entries;
    }

    async getStockByProductId(product_id: number) {

        await this.productExists(product_id);

        const stock = await Repositories.inventory.findStockByProductId(product_id);

        return stock;
    }
}
