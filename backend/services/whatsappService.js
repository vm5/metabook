const axios = require('axios');

class WhatsAppService {
    constructor() {
        // Your WhatsApp number that will send verification codes
        this.senderNumber = '17542529529'; // Replace with your WhatsApp number (without +)
    }

    async sendVerificationCode(phoneNumber, code) {
        try {
            // Format the phone number (remove +, spaces, and any other non-numeric characters)
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // Create the WhatsApp message
            const message = `Your LUCIFER verification code is: ${code}\nThis code will expire in 5 minutes.`;
            
            // Create the WhatsApp URL
            const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

            // For development, log the details
            console.log(`[WhatsApp Verification] Details:`);
            console.log(`Phone: ${formattedNumber}`);
            console.log(`Code: ${code}`);
            console.log(`URL: ${whatsappUrl}`);

            return {
                success: true,
                url: whatsappUrl,
                code: code // Only included in development
            };
        } catch (error) {
            console.error('Error in WhatsApp service:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async isPhoneNumberValid(phoneNumber) {
        // Basic phone number validation
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        return cleanNumber.length >= 10 && cleanNumber.length <= 15;
    }
}

// Create and export a singleton instance
const whatsappService = new WhatsAppService();
module.exports = whatsappService; 