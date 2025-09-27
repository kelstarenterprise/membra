// src/lib/id-card-generator.ts
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Types for ID card generation
export interface MemberCardData {
  id: string;
  membershipId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: Date;
  membershipLevel: string;
  status: string;
  nationality: string | null;
  passportPictureUrl: string | null;
  memberCategory?: {
    code: string;
    name: string;
  } | null;
  createdAt: Date;
}

export interface CardGenerationOptions {
  format: 'pdf' | 'png' | 'jpeg';
  includeBack?: boolean;
  organizationLogo?: string;
  organizationName?: string;
  cardTemplate?: 'standard' | 'premium';
}

export interface GeneratedCard {
  frontImageUrl?: string;
  backImageUrl?: string;
  pdfBuffer?: Buffer;
  qrData: string;
  cardNumber: string;
}

// Standard ID card dimensions (in mm)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;

// Convert mm to points (1 mm = 2.834645669 points)
const MM_TO_POINTS = 2.834645669;
const CARD_WIDTH_POINTS = CARD_WIDTH_MM * MM_TO_POINTS;
const CARD_HEIGHT_POINTS = CARD_HEIGHT_MM * MM_TO_POINTS;

export class IdCardGenerator {
  private organizationName: string;
  private organizationLogoUrl?: string;

  constructor(orgName = 'Revolution For Prosperity', logoUrl?: string) {
    this.organizationName = orgName;
    this.organizationLogoUrl = logoUrl;
  }

  /**
   * Generate a complete ID card for a member
   */
  async generateCard(
    member: MemberCardData,
    options: CardGenerationOptions = { format: 'pdf', includeBack: true }
  ): Promise<GeneratedCard> {
    const cardNumber = this.generateCardNumber(member);
    const qrData = this.generateQRData(member, cardNumber);
    
    const result: GeneratedCard = {
      qrData,
      cardNumber,
    };

    if (options.format === 'pdf') {
      result.pdfBuffer = await this.generatePDF(member, cardNumber, qrData, options);
    } else {
      // For image formats, we'll use HTML2Canvas approach
      const { frontImageUrl, backImageUrl } = await this.generateImages(
        member, 
        cardNumber, 
        qrData, 
        options
      );
      result.frontImageUrl = frontImageUrl;
      result.backImageUrl = backImageUrl;
    }

    return result;
  }

  /**
   * Generate QR code data for the card
   */
  private generateQRData(member: MemberCardData, cardNumber: string): string {
    const qrPayload = {
      cardNumber,
      membershipId: member.membershipId,
      memberId: member.id,
      name: `${member.firstName} ${member.lastName}`,
      level: member.memberCategory?.code || 'BASIC',
      issuedAt: new Date().toISOString(),
      // Add verification hash for security
      hash: this.generateVerificationHash(member.id, cardNumber)
    };

    return JSON.stringify(qrPayload);
  }

  /**
   * Generate a verification hash for security
   */
  private generateVerificationHash(memberId: string, cardNumber: string): string {
    // Simple hash for demo - in production, use proper cryptographic hashing
    const data = `${memberId}-${cardNumber}-${process.env.CARD_SECRET || 'default-secret'}`;
    return Buffer.from(data).toString('base64').substring(0, 16);
  }

  /**
   * Generate card number
   */
  private generateCardNumber(member: MemberCardData): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const categoryCode = member.memberCategory?.code?.substring(0, 2) || 'GE';
    const memberIdSuffix = member.membershipId?.slice(-4) || Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${categoryCode}${year}${memberIdSuffix}`;
  }

  /**
   * Generate PDF version of the ID card
   */
  private async generatePDF(
    member: MemberCardData,
    cardNumber: string,
    qrData: string,
    options: CardGenerationOptions
  ): Promise<Buffer> {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [CARD_WIDTH_POINTS, CARD_HEIGHT_POINTS]
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 60,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate front of card
    this.generatePDFFront(pdf, member, cardNumber, qrCodeDataUrl);

    // Generate back of card if requested
    if (options.includeBack) {
      pdf.addPage([CARD_WIDTH_POINTS, CARD_HEIGHT_POINTS], 'landscape');
      this.generatePDFBack(pdf, member, cardNumber);
    }

    return Buffer.from(pdf.output('arraybuffer'));
  }

  /**
   * Generate front side of PDF card
   */
  private generatePDFFront(
    pdf: jsPDF,
    member: MemberCardData,
    cardNumber: string,
    qrCodeDataUrl: string
  ): void {
    const width = CARD_WIDTH_POINTS;
    const height = CARD_HEIGHT_POINTS;

    // Background and border
    pdf.setFillColor(245, 245, 250); // Light background
    pdf.rect(0, 0, width, height, 'F');
    
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(2);
    pdf.rect(5, 5, width - 10, height - 10, 'S');

    // Header with organization name
    pdf.setFillColor(41, 128, 185); // Blue header
    pdf.rect(5, 5, width - 10, 35, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(this.organizationName, width / 2, 25, { align: 'center' });

    // Member photo placeholder (if no photo available)
    const photoX = 15;
    const photoY = 50;
    const photoSize = 60;
    
    if (member.passportPictureUrl) {
      // In a real implementation, you'd load and add the actual image
      // For now, we'll create a placeholder
      pdf.setFillColor(200, 200, 200);
      pdf.rect(photoX, photoY, photoSize, photoSize, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('PHOTO', photoX + photoSize/2, photoY + photoSize/2, { align: 'center' });
    } else {
      pdf.setFillColor(230, 230, 230);
      pdf.rect(photoX, photoY, photoSize, photoSize, 'F');
      pdf.setDrawColor(150, 150, 150);
      pdf.rect(photoX, photoY, photoSize, photoSize, 'S');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('NO PHOTO', photoX + photoSize/2, photoY + photoSize/2, { align: 'center' });
    }

    // Member information
    const infoX = photoX + photoSize + 15;
    let infoY = 55;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${member.firstName} ${member.lastName}`, infoX, infoY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    infoY += 12;
    pdf.text(`ID: ${member.membershipId || 'N/A'}`, infoX, infoY);

    infoY += 10;
    pdf.text(`Level: ${member.memberCategory?.name || member.membershipLevel}`, infoX, infoY);

    infoY += 10;
    pdf.text(`Status: ${this.formatStatus(member.status)}`, infoX, infoY);

    // QR Code
    const qrX = width - 70;
    const qrY = 50;
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, 60, 60);

    // Card number at bottom
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Card #: ${cardNumber}`, width / 2, height - 15, { align: 'center' });

    // Expiry date (2 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);
    pdf.text(`Expires: ${expiryDate.toLocaleDateString()}`, width / 2, height - 8, { align: 'center' });
  }

  /**
   * Generate back side of PDF card
   */
  private generatePDFBack(
    pdf: jsPDF,
    member: MemberCardData,
    cardNumber: string
  ): void {
    const width = CARD_WIDTH_POINTS;
    const height = CARD_HEIGHT_POINTS;

    // Background and border
    pdf.setFillColor(245, 245, 250);
    pdf.rect(0, 0, width, height, 'F');
    
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(2);
    pdf.rect(5, 5, width - 10, height - 10, 'S');

    // Header
    pdf.setFillColor(41, 128, 185);
    pdf.rect(5, 5, width - 10, 25, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('MEMBER INFORMATION', width / 2, 22, { align: 'center' });

    // Member details
    let y = 45;
    const leftMargin = 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    // Contact information
    if (member.email) {
      pdf.text(`Email: ${member.email}`, leftMargin, y);
      y += 12;
    }
    
    pdf.text(`Phone: ${member.phone}`, leftMargin, y);
    y += 12;

    if (member.nationality) {
      pdf.text(`Nationality: ${member.nationality}`, leftMargin, y);
      y += 12;
    }

    // Member since
    pdf.text(`Member Since: ${member.createdAt.getFullYear()}`, leftMargin, y);
    y += 15;

    // Terms and conditions
    pdf.setFontSize(6);
    pdf.setTextColor(80, 80, 80);
    pdf.text('This card remains the property of the organization.', leftMargin, y);
    y += 8;
    pdf.text('Report loss or theft immediately.', leftMargin, y);
    y += 8;
    pdf.text('Not transferable. Valid only with photo ID.', leftMargin, y);

    // Security elements
    pdf.setFontSize(5);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Security Code: ${cardNumber}-${Date.now().toString().slice(-4)}`, width - 10, height - 10, { align: 'right' });
  }

  /**
   * Generate image versions (PNG/JPEG) using Canvas
   * Note: This would typically use html2canvas or a similar library
   * For now, this is a placeholder that would need proper implementation
   */
  private async generateImages(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _member: MemberCardData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cardNumber: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _qrData: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: CardGenerationOptions
  ): Promise<{ frontImageUrl?: string; backImageUrl?: string }> {
    // This is a placeholder - in a real implementation, you would:
    // 1. Create HTML templates for the cards
    // 2. Use html2canvas to convert them to images
    // 3. Save the images and return URLs
    
    console.log('Image generation not yet implemented. Use PDF format for now.');
    return {};
  }

  /**
   * Format member status for display
   */
  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Active',
      'PENDING': 'Pending',
      'PROSPECT': 'Prospect',
      'SUSPENDED': 'Suspended'
    };
    return statusMap[status] || status;
  }

  /**
   * Batch generate cards for multiple members
   */
  async generateBatchCards(
    members: MemberCardData[],
    options: CardGenerationOptions = { format: 'pdf' }
  ): Promise<Map<string, GeneratedCard>> {
    const results = new Map<string, GeneratedCard>();
    
    for (const member of members) {
      try {
        const card = await this.generateCard(member, options);
        results.set(member.id, card);
      } catch (error) {
        console.error(`Failed to generate card for member ${member.id}:`, error);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const idCardGenerator = new IdCardGenerator();

// Helper function to validate QR code data
export function validateCardQRData(qrDataString: string): boolean {
  try {
    const data = JSON.parse(qrDataString);
    return !!(data.cardNumber && data.membershipId && data.name && data.hash);
  } catch {
    return false;
  }
}