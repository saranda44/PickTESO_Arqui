export interface IStore {
    id: number;
    name: string;
    location: string;
    opening_time: string;
    closing_time: string;
    image?: string | null;
    active: boolean;
    admin_id: number;
    created_at: Date;
    updated_at: Date;
}