import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('smtp.host'),
      port: config.get<number>('smtp.port'),
      secure: false,
      auth: {
        user: config.get<string>('smtp.user'),
        pass: config.get<string>('smtp.pass'),
      },
    });
  }

  async sendOtp(to: string, otp: string, purpose: string) {
    const subjects: Record<string, string> = {
      EMAIL_VERIFICATION: 'Verify your RentFlow email',
      PASSWORD_RESET: 'RentFlow — Password Reset OTP',
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subjects[purpose]} | OTP: ${otp}`);
        return;
      }

      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject: subjects[purpose] ?? 'RentFlow OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color:#1a1a2e;">RentFlow</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing:8px; color:#4f46e5; font-size:40px;">${otp}</h1>
            <p style="color:#666;">Valid for 10 minutes. Do not share this code.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}:`, err);
    }
  }

  async sendPaymentVerified(to: string, receiptId: string, amount: number, month: number, year: number) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject: `✅ Rent Payment Verified — ${month}/${year}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px;">
            <h2 style="color:#1a1a2e;">RentFlow</h2>
            <p>Your rent payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for ${month}/${year} has been verified.</p>
            <p><strong>Receipt ID:</strong> ${receiptId}</p>
            <p>Login to your dashboard to download the receipt.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send payment verified email:`, err);
    }
  }

  async sendPaymentRejected(to: string, amount: number, reason: string, month: number, year: number) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject: `❌ Payment Submission Rejected — ${month}/${year}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px;">
            <h2 style="color:#1a1a2e;">RentFlow</h2>
            <p>Your payment submission for ₹${amount.toLocaleString('en-IN')} (${month}/${year}) was rejected.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please resubmit with correct payment details.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send payment rejected email:`, err);
    }
  }

  async sendRentReminder(to: string, amount: number, dueDate: Date, propertyName: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject: `⚠️ Rent Due Reminder — ${propertyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px;">
            <h2 style="color:#1a1a2e;">RentFlow</h2>
            <p>Your rent of <strong>₹${amount.toLocaleString('en-IN')}</strong> is due on <strong>${dueDate.toLocaleDateString('en-IN')}</strong>.</p>
            <p>Please pay and upload the payment proof in your RentFlow dashboard.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send reminder email:`, err);
    }
  }
}
