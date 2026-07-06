// ========================================================
// NIGAZHTHISAI SUPER APP REPOSITORY (RPC-EXCLUSIVE)
// ========================================================

import { supabase } from '../lib/supabase';
import { RazorpayOrder } from '../types/nigazhthisai';

export class NigazhthisaiRepository {
  
  static async triggerSOS(userId: string, lat: number, lng: number): Promise<number> {
    const { data, error } = await supabase.rpc('rpc_trigger_sos', {
      user_uuid: userId,
      lat: lat,
      lng: lng
    });
    if (error) throw error;
    return data as number;
  }

  static async createRazorpayOrder(userId: string, amount: number): Promise<RazorpayOrder> {
    const { data, error } = await supabase.rpc('rpc_create_razorpay_order', {
      user_uuid: userId,
      order_amount: amount
    });
    if (error) throw error;
    return data as RazorpayOrder;
  }

  static async verifyRazorpayPayment(
    userId: string,
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('rpc_verify_razorpay_payment', {
      user_uuid: userId,
      rzp_payment_id: paymentId,
      rzp_order_id: orderId,
      rzp_signature: signature
    });
    if (error) throw error;
    return data;
  }
}
