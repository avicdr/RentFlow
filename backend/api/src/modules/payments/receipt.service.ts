import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ReceiptService {
  constructor(private config: ConfigService) {}

  async generate(payment: any, tenant: any, property: any, landlord: any) {
    const storageDir = this.config.get<string>('receipt.storageDir') ?? './uploads/receipts';
    fs.mkdirSync(storageDir, { recursive: true });

    // Add a random suffix so two receipts generated in the same millisecond can't collide.
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptId = `RF-${payment.year}-${String(payment.month).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}${suffix}`;
    const fileName = `${receiptId}.pdf`;
    const filePath = path.join(storageDir, fileName);

    // Compute the verification hash BEFORE rendering the PDF so it can be printed on the receipt.
    const hashContent = `${receiptId}|${payment._id}|${payment.amount}|${payment.submission?.utrNumber ?? ''}`;
    const verificationHash = crypto
      .createHmac('sha256', this.config.get<string>('encryption.fieldKey') ?? 'dev-key')
      .update(hashContent)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    await this.generatePdf(filePath, receiptId, verificationHash, payment, tenant, property, landlord);

    const baseUrl = this.config.get<string>('receipt.baseUrl');
    return {
      receiptId,
      pdfPath: filePath,
      generatedAt: new Date(),
      verificationHash,
      downloadUrl: `${baseUrl}/${fileName}`,
    };
  }

  private generatePdf(
    filePath: string,
    receiptId: string,
    verificationHash: string,
    payment: any,
    tenant: any,
    property: any,
    landlord: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const blue = '#4f46e5';
      const dark = '#1a1a2e';
      const grey = '#6b7280';

      // Header background bar
      doc.rect(0, 0, 595, 90).fill(blue);
      doc.fill('white').fontSize(28).font('Helvetica-Bold').text('RentFlow', 50, 25);
      doc.fontSize(11).font('Helvetica').text('Official Rent Receipt', 50, 60);

      // Receipt ID + Date
      doc.fill(dark).fontSize(11).font('Helvetica-Bold')
        .text(`Receipt ID: ${receiptId}`, 50, 115)
        .text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 115);

      // Divider
      doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#e5e7eb').stroke();

      // Tenant section
      doc.fill(blue).fontSize(9).font('Helvetica-Bold').text('TENANT DETAILS', 50, 165);
      doc.fill(dark).fontSize(11).font('Helvetica')
        .text(`${tenant.firstName} ${tenant.lastName}`, 50, 182)
        .text(tenant.phone ?? '', 50, 200)
        .text(tenant.email ?? '', 50, 218);

      // Property section
      doc.fill(blue).fontSize(9).font('Helvetica-Bold').text('PROPERTY DETAILS', 310, 165);
      doc.fill(dark).fontSize(11).font('Helvetica')
        .text(property.name, 310, 182)
        .text(`${property.address?.city}, ${property.address?.state}`, 310, 200)
        .text(property.address?.pincode ?? '', 310, 218);

      doc.moveTo(50, 248).lineTo(545, 248).strokeColor('#e5e7eb').stroke();

      // Payment details
      doc.fill(blue).fontSize(9).font('Helvetica-Bold').text('PAYMENT DETAILS', 50, 268);

      const details = [
        ['Rent Month', `${String(payment.month).padStart(2, '0')}/${payment.year}`],
        ['Amount Due', `₹${payment.amount.toLocaleString('en-IN')}`],
        ['Amount Paid', `₹${(payment.submission?.paidAmount ?? payment.amount).toLocaleString('en-IN')}`],
        ['Payment Method', payment.submission?.paymentMethod ?? 'N/A'],
        ['UTR / Reference', payment.submission?.utrNumber ?? 'N/A'],
        ['Submitted On', payment.submission?.submittedAt
          ? new Date(payment.submission.submittedAt).toLocaleDateString('en-IN')
          : 'N/A'],
        ['Verified On', new Date().toLocaleDateString('en-IN')],
        ['Verified By', `${landlord.firstName} ${landlord.lastName}`],
      ];

      let y = 290;
      details.forEach(([label, value]) => {
        doc.fill(grey).fontSize(10).font('Helvetica').text(label, 50, y);
        doc.fill(dark).font('Helvetica-Bold').text(value, 250, y);
        y += 22;
      });

      // Amount box
      doc.rect(50, y + 10, 495, 50).fill('#f0fdf4');
      doc.fill('#166534').fontSize(18).font('Helvetica-Bold')
        .text(`TOTAL PAID: ₹${(payment.submission?.paidAmount ?? payment.amount).toLocaleString('en-IN')}`, 0, y + 24, { align: 'center' });

      // Footer
      doc.moveTo(50, 720).lineTo(545, 720).strokeColor('#e5e7eb').stroke();
      doc.fill(grey).fontSize(8).font('Helvetica')
        .text(`Verification Hash: ${verificationHash}`, 50, 730)
        .text('This is a system-generated receipt. No physical signature required.', 50, 745)
        .text('RentFlow Property Management Platform', 0, 760, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
}
