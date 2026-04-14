export interface ITag {
    id: number;
    store_id: number;
    name: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}