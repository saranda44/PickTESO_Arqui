import axios from "axios";
import { IStore } from "../interfaces";
import { BadRequestError, NotFoundError } from "../errors";
import Repositories from "../repositories";
import { deleteImageFromS3, uploadImageToS3 } from "./s3.service";

export class StoreService {

    // ----------------------------
    // AUXILIARY VALIDATION METHODS
    // ----------------------------

    private async storeExists(id: number): Promise<IStore> {
        const store = await Repositories.store.findById(id);
        if (!store) throw new NotFoundError("La tienda especificada no existe.");
        return store;
    }

    private async adminExists(admin_id: number) {

        // try {
        //     // To do: Implementar verificación real contra el servicio de usuarios. Por ahora, se asume que cualquier ID numérico es válido.
        //     // const response = await axios.get(`${process.env.USER_SERVICE_URL}/users/${admin_id}`);
        //     // if (!response.data) throw new BadRequestError("El administrador especificado no existe.");
        //     const response = await pool.query("SELECT id FROM users WHERE id = $1", [admin_id]);
        //     if (!response.rows[0]) {
        //         throw new BadRequestError("El administrador especificado no existe.");
        //     }
        // } catch (error: any) {
        //     if (error.response?.status === 404) {
        //         throw new BadRequestError("El administrador especificado no existe.");
        //     }
        //     throw new BadRequestError("No se pudo verificar el administrador.");
        // }

        const exists = await Repositories.user.exists(admin_id);
        if (!exists) throw new BadRequestError("El administrador especificado no existe.");
    }

    // ---------------
    // PUBLIC METHODS
    // ---------------

    async createStore(data: Omit<IStore, "id" | "created_at" | "updated_at">): Promise<IStore> {
        await this.adminExists(data.admin_id);
        return await Repositories.store.create(data);
    }

    async getStoreById(id: number): Promise<IStore> {
        return await this.storeExists(id);
    }

    async getStoresByAdminId(admin_id: number): Promise<IStore[]> {
        await this.adminExists(admin_id);
        return await Repositories.store.findByAdminId(admin_id);
    }

    async updateStore(
        id: number,
        data: Partial<Omit<IStore, "id" | "created_at" | "updated_at" | "admin_id">>,
        imageBuffer?: Buffer
    ): Promise<IStore> {

        // Validate that at least one updatable field is provided
        const allowedFields = ["name", "location", "opening_time", "closing_time", "image", "active"];
        const hasInvalidFields = Object.keys(data).some(f => !allowedFields.includes(f));
        if (hasInvalidFields) {
            throw new BadRequestError("Se proporcionaron campos no válidos para actualizar.");
        }

        const existing = await this.storeExists(id);

        const oldImage = existing.image;
        let newImageUrl: string | undefined;

        if (imageBuffer) {
            // subir nueva imagen antes de borrar la anterior
            newImageUrl = await uploadImageToS3(imageBuffer, "stores");
            data.image = newImageUrl;
        }

        const updated = await Repositories.store.update(id, data);
        if (!updated) {
            // si la actualización falla, removemos la nueva imagen subida (si aplica)
            if (newImageUrl) {
                try { await deleteImageFromS3(newImageUrl); } catch (_) { }
            }
            throw new BadRequestError("No se proporcionaron campos válidos para actualizar.");
        }

        // si la actualización fue exitosa, borramos la anterior (si existía)
        if (newImageUrl && oldImage) {
            try { await deleteImageFromS3(oldImage); } catch (_) { }
        }

        return updated;
    }

    async softDeleteStore(id: number): Promise<boolean> {
        await this.storeExists(id);
        return await Repositories.store.softDelete(id);
    }
}