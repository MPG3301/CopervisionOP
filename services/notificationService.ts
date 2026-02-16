
import { Booking, User } from '../types';

/**
 * PRODUCTION SETUP:
 * 1. RESEND_API_KEY is required for Emails.
 * 2. WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required for WhatsApp.
 */

const ADMIN_EMAIL = 'vk_nalla@yahoo.com';

export const notificationService = {
  
  async sendBookingEmail(booking: Booking, user: User) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not found. Skipping email automation.');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'CooperVision Rewards <notifications@resend.dev>',
          to: [ADMIN_EMAIL],
          subject: `New Order: ${booking.id} - ${user.full_name}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2 style="color: #005696;">New Order Notification</h2>
              <p>A new order has been placed through the rewards portal.</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking ID</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.id}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Optometrist</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${user.full_name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Product</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.product_name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Quantity</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.quantity}</td></tr>
              </table>
              <p>Please log in to the admin panel to approve or reject this booking.</p>
            </div>
          `,
        }),
      });
      return response.ok;
    } catch (e) {
      console.error('Resend automation failed:', e);
      return false;
    }
  },

  async sendWhatsAppAlert(booking: Booking, user: User) {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!token || !phoneId) {
      console.warn('WhatsApp API credentials not found. Skipping alert.');
      return false;
    }

    try {
      // Note: In a real production app, you'd use a verified template.
      // This is a stub for the Meta Graph API call.
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: "91XXXXXXXXXX", // Should be replaced with your verified admin number
          type: "text",
          text: {
            body: `New Order! ${user.full_name} from ${user.shop_name} ordered ${booking.quantity}x ${booking.product_name}. ID: ${booking.id}`
          }
        }),
      });
      return response.ok;
    } catch (e) {
      console.error('WhatsApp automation failed:', e);
      return false;
    }
  }
};
