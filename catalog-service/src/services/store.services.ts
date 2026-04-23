import { IStore } from "../interfaces";
import { NotFoundError } from "../errors";
import Repositories from "../repositories";

export class StoreService {

    // ----------------------------
    // AUXILIARY METHODS
    // ----------------------------

    private async storeExists(id: number): Promise<IStore> {
        const store = await Repositories.store.findById(id);
        if (!store || !store.active) {
            throw new NotFoundError("The specified store does not exist.");
        }
        return store;
    }

    // ---------------
    // PUBLIC METHODS
    // ---------------

    async getAllStores(): Promise<IStore[]> {
        return await Repositories.store.findAllActive();
    }

    async getStoreById(id: number): Promise<IStore> {
        return await this.storeExists(id);
    }

    async searchStores(query: string): Promise<IStore[]> {
        if (!query || query.trim().length === 0) {
            return await this.getAllStores();
        }

        return await Repositories.store.searchByName(query);
    }
}