import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', 
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/book', async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    checkIn, 
    checkOut, 
    guests, 
    apartmentTitle, 
    pricePerNight, 
    paymentMethod,
    language = 'en'
  } = req.body;

  try {
    // Localized Strings
    const t = {
      en: {
        subject: `Booking Confirmation: ${apartmentTitle}`,
        title: 'Booking Confirmed!',
        greeting: `Dear ${firstName} ${lastName},`,
        received: 'Thank you for choosing UrbanStay. Your reservation request has been received.',
        details: 'Reservation Details',
        property: 'Property:',
        dates: 'Dates:',
        guests: 'Guests:',
        paymentRequired: 'Payment Required',
        payVia: `Please complete your payment via ${paymentMethod.toUpperCase()}.`,
        amount: 'Amount:',
        number: 'Number:',
        footer: 'If you have any questions, reply to this email.',
        plainText: `Your booking for ${apartmentTitle} is confirmed. Please pay $${pricePerNight}.`
      },
      pl: {
        subject: `Potwierdzenie Rezerwacji: ${apartmentTitle}`,
        title: 'Rezerwacja Potwierdzona!',
        greeting: `Szanowny/a ${firstName} ${lastName},`,
        received: 'Dziękujemy za wybór UrbanStay. Twoja prośba o rezerwację została otrzymana.',
        details: 'Szczegóły Rezerwacji',
        property: 'Obiekt:',
        dates: 'Termin:',
        guests: 'Goście:',
        paymentRequired: 'Wymagana Płatność',
        payVia: `Prosimy o dokonanie płatności przez ${paymentMethod.toUpperCase()}.`,
        amount: 'Kwota:',
        number: 'Numer:',
        footer: 'Jeśli masz pytania, odpowiedz na ten email.',
        plainText: `Twoja rezerwacja dla ${apartmentTitle} została potwierdzona. Prosimy o zapłatę $${pricePerNight}.`
      }
    };

    const strings = t[language] || t.en;

    // Generate HTML content on the server
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff; color: #333;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${strings.title}</h1>
        </div>
        
        <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
          <p><strong>${strings.greeting}</strong></p>
          <p>${strings.received}</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827; font-size: 18px; margin-bottom: 10px;">${strings.details}</h3>
            <p style="margin: 5px 0;"><strong>${strings.property}</strong> ${apartmentTitle}</p>
            <p style="margin: 5px 0;"><strong>${strings.dates}</strong> ${checkIn} - ${checkOut}</p>
            <p style="margin: 5px 0;"><strong>${strings.guests}</strong> ${guests}</p>
          </div>

          <div style="border: 2px dashed #4f46e5; padding: 15px; border-radius: 6px; background-color: #eef2ff;">
            <h3 style="margin-top: 0; color: #4f46e5; font-size: 18px; margin-bottom: 10px;">${strings.paymentRequired}</h3>
            <p style="margin: 0 0 10px 0;">${strings.payVia}</p>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${strings.amount} $${pricePerNight}</p>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${strings.number} +48 123 456 789</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">${strings.footer}</p>
        </div>
      </div>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"UrbanStay" <${process.env.SMTP_USER}>`,
      to: email,
      subject: strings.subject,
      text: strings.plainText,
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
