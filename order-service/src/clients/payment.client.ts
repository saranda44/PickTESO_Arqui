// Payments Service
// Used by Orders to request refunds when a store cancels a paid order
import axios from 'axios';

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL;

type PaymentIntentResponse = {
  client_secret: string;
};

function getErrorDetails(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    if (maybeResponse?.data !== undefined) {
      return typeof maybeResponse.data === 'string'
        ? maybeResponse.data
        : JSON.stringify(maybeResponse.data);
    }

    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}

//cancel payment for an order
// Called by Orders when a store cancels an order that has already been paid
export async function cancelPayment(orderId: number): Promise<void> {
  const endpoint = `${PAYMENTS_SERVICE_URL}/${orderId}/cancel`; 
  try{
    await axios.post(endpoint, { orderId });
  }
  catch (error: unknown) {
    console.error(
      `[payments.client] Failed to cancel payment for order ${orderId}:`,
      getErrorDetails(error)
    );
  }
}


// Create payment intent for an order
// Called by Orders when a new order is created and needs to be paid
export async function createPaymentIntent(orderId: number, amount: number, userId: number, currency: string = 'mxn'): Promise<string> {
  const endpoint = `${PAYMENTS_SERVICE_URL}/create-payment-intent`;
  const amountInCents = Math.round(amount * 100);
  try {
    const response = await axios.post<any>(endpoint, { orderId:Number(orderId) , amount:amountInCents, userId:Number(userId), currency, orderValue: amountInCents });
    return response.data.client_secret;
  } catch (error: unknown) {
    console.error(
      `[payments.client] Failed to create payment intent for order ${orderId}:`,
      getErrorDetails(error)
    );
    throw error;
  }
}