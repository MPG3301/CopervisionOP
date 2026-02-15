
import { Booking, User } from '../types';

/**
 * PRODUCTION SETUP:
 * 1. Go to resend.com and get your API Key.
 * 2. Go to developers.facebook.com for WhatsApp API.
 * 3. Store keys in Vercel Environment Variables, NOT in this file.
 */

const ADMIN_EMAIL = 'vk_nalla@yahoo.com';
const WHATSAPP_RECIPIENT = '91XXXXXXXXXX'; // Your number

export const notificationService = {
  
  async sendBookingEmail(booking: Booking, user: User) {
    console.log('--- Email Automation ---');
    console.log('Sending to:', ADMIN_EMAIL);
    
    // Simulate API Request
    try {
      // In production, you would fetch('https://api.resend.com/emails', ...)
      return true;
    } catch (e) {
      console.error('Email failed:', e);
      return false;
    }
  },

  async sendWhatsAppAlert(booking: Booking, user: User) {
    console.log('--- WhatsApp Automation ---');
    console.log('Sending alert for:', booking.id);
    
    // Meta API Endpoint Template
    // https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages
    
    return true;
  }
};
