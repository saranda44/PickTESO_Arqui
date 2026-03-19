import { ITag } from "../interfaces";
import { BadRequestError, NotFoundError } from "../errors";
import Repositories from "../repositories";

export class TagService {

    // ----------------------------
    // AUXILIARY VALIDATION METHODS
    // ----------------------------

    private async storeExists(storeId: number) {
        const store = await Repositories.store.findById(storeId);
        if (!store) throw new BadRequestError("La tienda especificada no existe.");
    }

    private async tagExists(id: number): Promise<ITag> {
        const tag = await Repositories.tag.findById(id);
        if (!tag) throw new NotFoundError("El tag especificado no existe.");
        return tag;
    }

    // ---------------
    // PUBLIC METHODS
    // ---------------

    async createTag(data: Omit<ITag, "id" | "created_at" | "updated_at">): Promise<ITag> {
        await this.storeExists(data.store_id);
        return await Repositories.tag.create(data);
    }

    async getTagById(id: number): Promise<ITag> {
        return await this.tagExists(id);
    }

    async getTagsByStoreId(store_id: number): Promise<ITag[]> {
        await this.storeExists(store_id);
        return await Repositories.tag.findAllByStoreId(store_id);
    }

    async updateTag(id: number, data: Partial<Omit<ITag, "id" | "created_at" | "updated_at">>): Promise<ITag> {
        await this.tagExists(id);

        // Validate that at least one updatable field is provided and that all provided fields are valid
        const allowedFields = ["name", "description", "start_time", "end_time", "color", "active"];
        const hasInvalidFields = Object.keys(data).some(f => !allowedFields.includes(f));
        if (hasInvalidFields) {
            throw new BadRequestError("Se proporcionaron campos no válidos para actualizar.");
        }


        const updated = await Repositories.tag.update(id, data);
        if (!updated) throw new BadRequestError("No se proporcionaron campos válidos para actualizar.");

        return updated;
    }

    async softDeleteTag(id: number): Promise<boolean> {
        await this.tagExists(id);
        return await Repositories.tag.softDelete(id);
    }
}