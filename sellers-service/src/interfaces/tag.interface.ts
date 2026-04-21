export interface ITag {
    id: number;
    store_id: number;
    name: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    color?: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}