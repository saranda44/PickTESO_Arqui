// Catalog Service
// Used by Orders to validate products and stores
import axios from "axios";

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL;

export interface CatalogProduct {
  id: number;
  store_id: number;
  name: string;
  price: number;
  active: boolean;
}

export interface CatalogStore {
  id: number;
  name: string;
  active: boolean;
  opening_time: string;
  closing_time: string;
  admin_id?: number;
}

// Fetch a single product from the catalog service
export async function getProductFromCatalog(productId: number): Promise<CatalogProduct | null> {
  const endpoint = `${CATALOG_SERVICE_URL}/products/${productId}`;
  try {
    const { data } = await axios.get<CatalogProduct>(endpoint);
    return data.active ? data : null;
  } catch (error) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      code?: string;
      message?: string;
    };
    const statusOrCode = err.response?.status ?? err.code ?? "unknown";
    const detail = typeof err.response?.data === "string" ? err.response.data : err.message;
    if (statusOrCode === 404) return null;

    throw new Error(
      `Catalog service error fetching product ${productId} from ${endpoint}: ${statusOrCode}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }
}


// Fetch a single store from the catalog service
export async function getStoreFromCatalog(storeId: number): Promise<CatalogStore | null> {
  const endpoint = `${CATALOG_SERVICE_URL}/stores/${storeId}`;
  try {
    const { data } = await axios.get<CatalogStore>(endpoint);
    return data.active ? data : null;
  } catch (error) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      code?: string;
      message?: string;
    };
    const statusOrCode = err.response?.status ?? err.code ?? "unknown";
    const detail = typeof err.response?.data === "string" ? err.response.data : err.message;
    if (statusOrCode === 404) return null;

    throw new Error(
      `Catalog service error fetching store ${storeId} from ${endpoint}: ${statusOrCode}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }
}

