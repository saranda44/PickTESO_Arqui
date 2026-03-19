import { IProduct, IProductWithTags } from "../interfaces";
import { BadRequestError, NotFoundError } from "../errors";
import Repositories from "../repositories";
import { uploadImageToS3, deleteImageFromS3 } from "./s3.service";

export class ProductService {

    // ----------------------------
    // AUXILIARY VALIDATION METHODS
    // ----------------------------

    private async storeExists(storeId: number) {
        const store = await Repositories.store.findById(storeId);
        if (!store) throw new BadRequestError("La tienda especificada no existe.");
    }

    private async productExists(id: number): Promise<IProduct> {
        const product = await Repositories.product.findById(id);
        if (!product) throw new NotFoundError("El producto especificado no existe.");
        return product;
    }

    // ---------------
    // PUBLIC METHODS
    // ---------------

    async createProduct(
        data: Omit<IProduct, "id" | "created_at" | "updated_at">,
        imageBuffer?: Buffer  // el buffer viene del middleware
    ): Promise<IProduct> {

        await this.storeExists(data.store_id);

        let uploadedUrl: string | undefined;
        if (imageBuffer) {
            // subimos primero; si falla la creación, borramos la imagen nueva
            uploadedUrl = await uploadImageToS3(imageBuffer, "products");
            data.product_image = uploadedUrl;
        }

        try {
            return await Repositories.product.create(data);
        } catch (error) {
            if (uploadedUrl) {
                try { await deleteImageFromS3(uploadedUrl); } catch (_) { }
            }
            throw error;
        }
    }

    async getProductById(id: number): Promise<IProduct> {
        return await this.productExists(id);
    }

    async updateProduct(
        id: number,
        data: Partial<Omit<IProduct, "id" | "created_at" | "updated_at">>,
        imageBuffer?: Buffer
    ): Promise<IProduct> {

        const allowedFields = ["name", "description", "price", "active"];
        const hasInvalidFields = Object.keys(data).some(f => !allowedFields.includes(f));
        if (hasInvalidFields) {
            throw new BadRequestError("Se proporcionaron campos no válidos para actualizar.");
        }

        const existing = await this.productExists(id);

        const oldImage = existing.product_image;
        let newImageUrl: string | undefined;

        if (imageBuffer) {
            // subimos nueva imagen antes de borrar la anterior
            newImageUrl = await uploadImageToS3(imageBuffer, "products");
            data.product_image = newImageUrl;
        }

        const updated = await Repositories.product.update(id, data);
        if (!updated) {
            // si la DB falla, limpiamos la nueva imagen subida (si aplica)
            if (newImageUrl) {
                try { await deleteImageFromS3(newImageUrl); } catch (_) { }
            }
            throw new BadRequestError("No se proporcionaron campos válidos para actualizar.");
        }

        // si la actualización fue exitosa, borramos la antigua imagen
        if (newImageUrl && oldImage) {
            try { await deleteImageFromS3(oldImage); } catch (_) { }
        }

        return updated;
    }

    async deleteProduct(id: number): Promise<boolean> {
        const existing = await this.productExists(id);

        if (existing.product_image) {
            await deleteImageFromS3(existing.product_image);
        }

        return await Repositories.product.delete(id);
    }

    async getProductsByStoreId(store_id: number): Promise<IProduct[]> {
        await this.storeExists(store_id);
        return await Repositories.product.findByStoreId(store_id);
    }

    async getProductsWithTags(store_id: number): Promise<IProductWithTags[]> {
        await this.storeExists(store_id);
        return await Repositories.product.getProductsWithTags(store_id);
    }
}