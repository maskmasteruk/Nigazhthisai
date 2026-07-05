// ========================================================
// NIGAZHTHISAI CUSTOM REACT HOOK
// ========================================================

import { useState, useCallback } from 'react';
import { NigazhthisaiService } from '../services/NigazhthisaiService';
import { toast } from 'sonner';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useNigazhthisai = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Trigger SOS
  const triggerSOS = async (lat: number, lng: number) => {
    if (!userId) return;
    try {
      await NigazhthisaiService.triggerSOS(userId, lat, lng);
      toast.error('Emergency SOS Sent! Local authorities have been notified.', {
        duration: 8000
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // 2. Process Razorpay Payment
  const processRazorpayPayment = async (
    amount: number, 
    purposeDescription: string, 
    onVerifySuccess: (paymentId: string) => void
  ) => {
    if (!userId) {
      toast.error('Session expired. Please log in.');
      return;
    }
    try {
      setIsLoading(true);
      const order = await NigazhthisaiService.createRazorpayOrder(userId, amount);
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        return;
      }

      const options = {
        key: order.key_id,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Nigazhthisai',
        description: purposeDescription,
        order_id: order.order_id,
        handler: async (response: any) => {
          try {
            setIsLoading(true);
            const verifyResult = await NigazhthisaiService.verifyRazorpayPayment(
              userId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            if (verifyResult.success || verifyResult.amount_credited) {
              toast.success('Payment verified successfully!');
              onVerifySuccess(response.razorpay_payment_id);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (e: any) {
            toast.error(e.message || 'Verification failed');
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: 'Nigazhthisai User',
          email: 'citizen@nigazhthisai.tn.gov.in',
          contact: '9999999999'
        },
        theme: {
          color: '#0D2A5D'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        toast.error('Payment failed: ' + resp.error.description);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || 'Payment initiation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    triggerSOS,
    processRazorpayPayment
  };
};

export default useNigazhthisai;
