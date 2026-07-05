// ========================================================
// NIGAZHTHISAI SUPER APP TYPES
// ========================================================

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  key_id: string;
  currency: string;
  status: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
