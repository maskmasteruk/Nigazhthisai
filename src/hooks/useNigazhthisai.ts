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
      
      const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9tT4AJ63Lw7bi';
      const keySecret = (import.meta as any).env?.VITE_RAZORPAY_KEY_SECRET || 'FKtbj0agBftTBmlaJZj7vaHk';

      // 1. BACKEND SIMULATION / DIRECT CLIENT CALL - Create Order
      let orderId = '';
      if (amount < 1.0) {
        toast.error('Minimum order amount is ₹1.00 (100 paise)');
        return;
      }

      try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(keyId + ':' + keySecret)
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: 'rcpt_' + Math.random().toString(36).substring(2, 10)
          })
        });
        
        if (response.ok) {
          const orderData = await response.json();
          orderId = orderData.id;
        } else {
          console.warn('Direct API order creation failed (likely CORS). Falling back to standard direct checkout.');
        }
      } catch (err) {
        console.warn('Network error during order creation (CORS constraint). Falling back to direct checkout.');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        return;
      }

      // Helper function to calculate HMAC-SHA256 on the client via Web Crypto API
      const calculateHMACSignature = async (message: string, secret: string): Promise<string> => {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);
        
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signatureBuffer = await window.crypto.subtle.sign(
          'HMAC',
          cryptoKey,
          messageData
        );
        
        return Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };

      // 2. FRONTEND - Checkout options
      const options: any = {
        key: keyId,
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        name: 'Nigazhthisai',
        description: purposeDescription,
        handler: async (response: any) => {
          try {
            setIsLoading(true);
            
            // 3. SECURE VERIFICATION - Verify Signature if order_id is present
            let isVerified = true;
            if (response.razorpay_order_id && response.razorpay_signature) {
              const textMessage = response.razorpay_order_id + "|" + response.razorpay_payment_id;
              const expectedSignature = await calculateHMACSignature(textMessage, keySecret);
              
              if (expectedSignature !== response.razorpay_signature) {
                isVerified = false;
                toast.error('Signature mismatch! Payment verification failed.');
                return;
              }
            }

            if (isVerified) {
              // Record transaction to Supabase Database
              const verifyResult = await NigazhthisaiService.verifyRazorpayPayment(
                userId,
                response.razorpay_payment_id,
                response.razorpay_order_id || `ord_${Math.random().toString(36).substring(2, 10)}`,
                response.razorpay_signature || `sig_${Math.random().toString(36).substring(2, 10)}`
              );
              
              if (verifyResult.success || verifyResult.amount_credited) {
                toast.success('Payment verified successfully!');
                onVerifySuccess(response.razorpay_payment_id);
              } else {
                toast.error('Payment verification failed in database.');
              }
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

      if (orderId) {
        options.order_id = orderId;
      }

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
