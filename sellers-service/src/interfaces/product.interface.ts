import { ITag } from "./tag.interface";

export interface IProduct {
    id: number;
    store_id: number;
    name: string;
    description?: string | null;
    price: number;
    product_image?: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IProductWithTags extends
    Pick<IProduct,
        'id' |
        'store_id' |
        'name' |
        'description' |
        'price' |
        'product_image' |
        'active'> {
    tags: Pick<ITag,
        'id' |
        'name' |
        'color'>[];
}
