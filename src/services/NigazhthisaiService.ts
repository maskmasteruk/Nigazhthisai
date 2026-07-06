// ========================================================
// NIGAZHTHISAI SERVICE
// ========================================================

import { NigazhthisaiRepository } from '../repositories/NigazhthisaiRepository';
import { RazorpayOrder } from '../types/nigazhthisai';

export class NigazhthisaiService {
  
  static async triggerSOS(userId: string, lat: number, lng: number): Promise<number> {
    if (!userId) throw new Error('Unauthorized.');
    return await NigazhthisaiRepository.triggerSOS(userId, lat, lng);
  }

  static async createRazorpayOrder(userId: string, amount: number): Promise<RazorpayOrder> {
    if (!userId) throw new Error('Unauthorized: Session required.');
    if (amount <= 0) throw new Error('Invalid Amount: Order total must be greater than zero.');
    return await NigazhthisaiRepository.createRazorpayOrder(userId, amount);
  }

  static async verifyRazorpayPayment(
    userId: string,
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<any> {
    if (!userId) throw new Error('Unauthorized.');
    if (!paymentId || !orderId || !signature) {
      throw new Error('Verification Error: Missing transaction token details.');
    }
    return await NigazhthisaiRepository.verifyRazorpayPayment(userId, paymentId, orderId, signature);
  }
}
