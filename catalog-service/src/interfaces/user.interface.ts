export type UserRole = 'customer' | 'store_admin' | 'platform_admin';

export interface User {
	id: number;
	first_name: string;
	paternal_last_name: string;
	maternal_last_name: string;
	email: string;
	role: UserRole;
	profile_image: string | null;
	active: boolean;
	created_at: Date;
	updated_at: Date;
}
