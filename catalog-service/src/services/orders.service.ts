import Repositories from "../repositories";

import {
    OrderWithProducts
} from '../interfaces/order.interface';

export const OrderService = {
    getOrdersByUser,
}

// Get all orders for a user
async function getOrdersByUser(userId: number): Promise<OrderWithProducts[]> {
    return Repositories.order.findByUserIdWithProducts(userId);
}

