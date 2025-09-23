import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clean existing data (optional, for development)
  await prisma.activityRegistration.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assignedDues.deleteMany();
  await prisma.duesPlan.deleteMany();
  await prisma.memberIdCard.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();
  await prisma.memberCategory.deleteMany();
  console.log("Deleted existing data");

  // Create member categories first
  const bronzeCategory = await prisma.memberCategory.create({
    data: {
      code: "BRONZE",
      name: "Bronze Level",
      description: "Basic membership level",
      rank: 3,
      active: true,
    },
  });

  const silverCategory = await prisma.memberCategory.create({
    data: {
      code: "SILVER",
      name: "Silver Level",
      description: "Intermediate membership level",
      rank: 2,
      active: true,
    },
  });

  const goldCategory = await prisma.memberCategory.create({
    data: {
      code: "GOLD",
      name: "Gold Level",
      description: "Premium membership level",
      rank: 1,
      active: true,
    },
  });

  const vipCategory = await prisma.memberCategory.create({
    data: {
      code: "VIP",
      name: "VIP Level",
      description: "Exclusive membership level",
      rank: 0,
      active: true,
    },
  });

  const beginnerCategory = await prisma.memberCategory.create({
    data: {
      code: "BEGINNER",
      name: "Beginner Level",
      description: "Entry-level membership",
      rank: 4,
      active: true,
    },
  });

  console.log("Created member categories");

  // Create sample members
  const member1 = await prisma.member.create({
    data: {
      membershipId: "MEM00000001",
      firstName: "Ama",
      lastName: "Mensah",
      dateOfBirth: new Date("1990-05-15"),
      gender: "FEMALE",
      nationalId: "GHA-1234567890",
      phone: "+233201111111",
      email: "ama.mensah@example.com",
      residentialAddress: "123 Ring Road, Accra, Ghana",
      regionConstituencyElectoralArea: "Greater Accra Region, Accra Central",
      occupation: "Teacher",
      highestEducationLevel: "TERTIARY",
      membershipLevel: "ORDINARY",
      branchWard: "Accra Central Branch",
      recruitedBy: "John Doe",
      memberCategoryId: bronzeCategory.id,
      status: "ACTIVE",
      outstandingBalance: 120.0,
      nationality: "Ghanaian",
      passportPictureUrl: "/images/members/ama.jpg",
    },
  });

  const member2 = await prisma.member.create({
    data: {
      membershipId: "MEM00000002",
      firstName: "Kwame",
      lastName: "Boateng",
      dateOfBirth: new Date("1985-03-22"),
      gender: "MALE",
      nationalId: "GHA-0987654321",
      phone: "+233202222222",
      email: "kwame.boateng@example.com",
      residentialAddress: "45 High Street, Kumasi, Ghana",
      regionConstituencyElectoralArea: "Ashanti Region, Kumasi Central",
      occupation: "Banker",
      highestEducationLevel: "TERTIARY",
      membershipLevel: "EXECUTIVE",
      branchWard: "Kumasi Branch",
      recruitedBy: "Mary Johnson",
      memberCategoryId: goldCategory.id,
      status: "ACTIVE",
      outstandingBalance: 0.0,
      nationality: "Ghanaian",
      passportPictureUrl: "/images/members/kwame.jpg",
    },
  });

  const member3 = await prisma.member.create({
    data: {
      membershipId: "MEM00000003",
      firstName: "Akosua",
      lastName: "Asante",
      dateOfBirth: new Date("1992-11-08"),
      gender: "FEMALE",
      nationalId: "GHA-1122334455",
      phone: "+233203333333",
      email: "akosua.asante@example.com",
      residentialAddress: "78 Liberation Road, Cape Coast, Ghana",
      regionConstituencyElectoralArea: "Central Region, Cape Coast North",
      occupation: "Nurse",
      highestEducationLevel: "TERTIARY",
      membershipLevel: "ORDINARY",
      branchWard: "Cape Coast Branch",
      memberCategoryId: silverCategory.id,
      status: "PENDING",
      outstandingBalance: 75.5,
      nationality: "Ghanaian",
    },
  });

  const member4 = await prisma.member.create({
    data: {
      membershipId: "MEM00000004",
      firstName: "Kofi",
      lastName: "Adjei",
      dateOfBirth: new Date("1988-07-14"),
      gender: "MALE",
      nationalId: "GHA-6677889900",
      phone: "+233204444444",
      email: "kofi.adjei@example.com",
      residentialAddress: "23 Market Circle, Tamale, Ghana",
      regionConstituencyElectoralArea: "Northern Region, Tamale Central",
      occupation: "Engineer",
      highestEducationLevel: "POSTGRADUATE",
      membershipLevel: "DELEGATE",
      branchWard: "Tamale Branch",
      recruitedBy: "Ama Mensah",
      memberCategoryId: vipCategory.id,
      status: "ACTIVE",
      outstandingBalance: 0.0,
      nationality: "Ghanaian",
      passportPictureUrl: "/images/members/kofi.jpg",
    },
  });

  const member5 = await prisma.member.create({
    data: {
      membershipId: "MEM00000005",
      firstName: "Efua",
      lastName: "Owusu",
      dateOfBirth: new Date("1995-01-30"),
      gender: "FEMALE",
      nationalId: "GHA-5544332211",
      phone: "+233205555555",
      residentialAddress: "67 Commercial Street, Takoradi, Ghana",
      regionConstituencyElectoralArea: "Western Region, Takoradi",
      occupation: "Student",
      highestEducationLevel: "SECONDARY",
      membershipLevel: "ORDINARY",
      branchWard: "Takoradi Branch",
      memberCategoryId: beginnerCategory.id,
      status: "PROSPECT",
      outstandingBalance: 200.0,
      nationality: "Ghanaian",
    },
  });

  console.log("Created members:", {
    member1: member1.id,
    member2: member2.id,
    member3: member3.id,
    member4: member4.id,
    member5: member5.id,
  });

  // Create users with authentication data
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@clubmanager.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      memberId: member2.id, // Link admin to Kwame Boateng
    },
  });

  const memberUser1 = await prisma.user.create({
    data: {
      username: "ama.mensah",
      email: "ama.mensah@example.com",
      passwordHash: hashedPassword,
      role: "MEMBER",
      memberId: member1.id,
    },
  });

  const memberUser2 = await prisma.user.create({
    data: {
      username: "kofi.adjei",
      email: "kofi.adjei@example.com",
      passwordHash: hashedPassword,
      role: "MEMBER",
      memberId: member4.id,
    },
  });

  console.log("Created users with authentication data");

  // Create dues plans for different categories
  const registrationFee = await prisma.duesPlan.create({
    data: {
      code: "REG_FEE",
      name: "Registration Fee",
      description: "One-time registration fee for new members",
      amount: 50.00,
      currency: "GHS",
      cycle: "ONE_TIME",
      active: true,
    },
  });

  const bronzeMonthlyDues = await prisma.duesPlan.create({
    data: {
      code: "BRONZE_MONTHLY",
      name: "Bronze Monthly Dues",
      description: "Monthly dues for Bronze level members",
      amount: 25.00,
      currency: "GHS",
      cycle: "MONTHLY",
      memberCategoryId: bronzeCategory.id,
      active: true,
    },
  });

  const silverQuarterlyDues = await prisma.duesPlan.create({
    data: {
      code: "SILVER_QUARTERLY",
      name: "Silver Quarterly Dues",
      description: "Quarterly dues for Silver level members",
      amount: 90.00,
      currency: "GHS",
      cycle: "QUARTERLY",
      memberCategoryId: silverCategory.id,
      active: true,
    },
  });

  const goldYearlyDues = await prisma.duesPlan.create({
    data: {
      code: "GOLD_YEARLY",
      name: "Gold Annual Dues",
      description: "Annual dues for Gold level members",
      amount: 300.00,
      currency: "GHS",
      cycle: "YEARLY",
      memberCategoryId: goldCategory.id,
      active: true,
    },
  });

  const vipYearlyDues = await prisma.duesPlan.create({
    data: {
      code: "VIP_YEARLY",
      name: "VIP Annual Dues",
      description: "Annual premium dues for VIP members",
      amount: 500.00,
      currency: "GHS",
      cycle: "YEARLY",
      memberCategoryId: vipCategory.id,
      active: true,
    },
  });

  console.log("Created dues plans");

  // Assign dues to members
  const member1RegistrationDue = await prisma.assignedDues.create({
    data: {
      memberId: member1.id,
      planId: registrationFee.id,
      memberCategoryId: bronzeCategory.id,
      amount: 50.00,
      currency: "GHS",
      dueDate: new Date("2024-01-15"),
      status: "PAID",
      reference: "DUE-REG-001",
      notes: "Initial registration fee",
    },
  });

  const member1MonthlyDue = await prisma.assignedDues.create({
    data: {
      memberId: member1.id,
      planId: bronzeMonthlyDues.id,
      memberCategoryId: bronzeCategory.id,
      amount: 25.00,
      currency: "GHS",
      dueDate: new Date("2024-10-31"),
      periodStart: new Date("2024-10-01"),
      periodEnd: new Date("2024-10-31"),
      status: "PENDING",
      reference: "DUE-MON-001",
    },
  });

  const member3QuarterlyDue = await prisma.assignedDues.create({
    data: {
      memberId: member3.id,
      planId: silverQuarterlyDues.id,
      memberCategoryId: silverCategory.id,
      amount: 90.00,
      currency: "GHS",
      dueDate: new Date("2024-12-31"),
      periodStart: new Date("2024-10-01"),
      periodEnd: new Date("2024-12-31"),
      status: "PARTIAL",
      reference: "DUE-QTR-001",
    },
  });

  const member4YearlyDue = await prisma.assignedDues.create({
    data: {
      memberId: member4.id,
      planId: vipYearlyDues.id,
      memberCategoryId: vipCategory.id,
      amount: 500.00,
      currency: "GHS",
      dueDate: new Date("2024-12-31"),
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-12-31"),
      status: "PAID",
      reference: "DUE-VIP-001",
    },
  });

  console.log("Created assigned dues");

  // Create payments
  const registrationPayment = await prisma.payment.create({
    data: {
      memberId: member1.id,
      assignedDueId: member1RegistrationDue.id,
      planId: registrationFee.id,
      description: "Registration fee payment",
      amount: 50.00,
      currency: "GHS",
      method: "BANK_TRANSFER",
      paidAt: new Date("2024-01-10"),
      reference: "PAY-REG-001",
    },
  });

  const partialPayment = await prisma.payment.create({
    data: {
      memberId: member3.id,
      assignedDueId: member3QuarterlyDue.id,
      planId: silverQuarterlyDues.id,
      description: "Partial quarterly dues payment",
      amount: 45.00,
      currency: "GHS",
      method: "MOBILE_MONEY",
      paidAt: new Date("2024-10-15"),
      reference: "PAY-QTR-001",
    },
  });

  const vipPayment = await prisma.payment.create({
    data: {
      memberId: member4.id,
      assignedDueId: member4YearlyDue.id,
      planId: vipYearlyDues.id,
      description: "VIP annual dues payment",
      amount: 500.00,
      currency: "GHS",
      method: "CARD",
      paidAt: new Date("2024-01-05"),
      reference: "PAY-VIP-001",
    },
  });

  const generalDonation = await prisma.payment.create({
    data: {
      memberId: member2.id,
      description: "General club donation",
      amount: 100.00,
      currency: "GHS",
      method: "CASH",
      paidAt: new Date("2024-09-20"),
      reference: "PAY-DON-001",
    },
  });

  console.log("Created payments");

  // Create activities
  const annualMeeting = await prisma.activity.create({
    data: {
      title: "Annual General Meeting",
      description: "Annual meeting to discuss club affairs and elect officers",
      startsAt: new Date("2024-11-15T09:00:00Z"),
      endsAt: new Date("2024-11-15T17:00:00Z"),
      location: "Conference Center, Accra",
    },
  });

  const networkingEvent = await prisma.activity.create({
    data: {
      title: "Members Networking Night",
      description: "Informal networking event for all members",
      startsAt: new Date("2024-10-28T18:00:00Z"),
      endsAt: new Date("2024-10-28T22:00:00Z"),
      location: "Golden Tulip Hotel, Accra",
    },
  });

  const trainingWorkshop = await prisma.activity.create({
    data: {
      title: "Professional Development Workshop",
      description: "Skills development workshop for members",
      startsAt: new Date("2024-12-05T10:00:00Z"),
      endsAt: new Date("2024-12-05T16:00:00Z"),
      location: "University of Ghana, Legon",
    },
  });

  const communityService = await prisma.activity.create({
    data: {
      title: "Community Clean-up Exercise",
      description: "Environmental service to the local community",
      startsAt: new Date("2024-11-30T07:00:00Z"),
      endsAt: new Date("2024-11-30T12:00:00Z"),
      location: "Labadi Beach, Accra",
    },
  });

  console.log("Created activities");

  // Create activity registrations
  await prisma.activityRegistration.create({
    data: {
      activityId: annualMeeting.id,
      memberId: member1.id,
      status: "REGISTERED",
      notes: "Will attend with spouse",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: annualMeeting.id,
      memberId: member2.id,
      status: "REGISTERED",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: annualMeeting.id,
      memberId: member4.id,
      status: "ATTENDED",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: networkingEvent.id,
      memberId: member1.id,
      status: "ATTENDED",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: networkingEvent.id,
      memberId: member3.id,
      status: "ABSENT",
      notes: "Could not attend due to work commitment",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: trainingWorkshop.id,
      memberId: member2.id,
      status: "INVITED",
    },
  });

  await prisma.activityRegistration.create({
    data: {
      activityId: communityService.id,
      memberId: member5.id,
      status: "REGISTERED",
    },
  });

  console.log("Created activity registrations");

  // Create notifications
  await prisma.notification.create({
    data: {
      memberId: member1.id,
      title: "Welcome to the Club!",
      body: "Your membership has been activated. Welcome aboard!",
      channel: "EMAIL",
      sentAt: new Date("2024-01-15T10:00:00Z"),
      readAt: new Date("2024-01-15T14:30:00Z"),
    },
  });

  await prisma.notification.create({
    data: {
      memberId: member1.id,
      title: "Monthly Dues Reminder",
      body: "Your monthly dues of GHS 25.00 are due on October 31, 2024.",
      channel: "SMS",
      sentAt: new Date("2024-10-25T09:00:00Z"),
    },
  });

  await prisma.notification.create({
    data: {
      memberId: member3.id,
      title: "Payment Received",
      body: "We have received your partial payment of GHS 45.00. Balance remaining: GHS 45.00",
      channel: "IN_APP",
      sentAt: new Date("2024-10-15T15:30:00Z"),
      readAt: new Date("2024-10-16T08:00:00Z"),
    },
  });

  await prisma.notification.create({
    data: {
      memberId: member2.id,
      title: "Annual General Meeting",
      body: "You are invited to attend our Annual General Meeting on November 15, 2024.",
      channel: "EMAIL",
      sentAt: new Date("2024-10-20T12:00:00Z"),
    },
  });

  await prisma.notification.create({
    data: {
      memberId: member4.id,
      title: "VIP Membership Benefits",
      body: "As a VIP member, you now have access to exclusive events and priority booking.",
      channel: "IN_APP",
      sentAt: new Date("2024-01-10T11:00:00Z"),
      readAt: new Date("2024-01-10T11:15:00Z"),
    },
  });

  console.log("Created notifications");

  // Create member ID cards
  await prisma.memberIdCard.create({
    data: {
      memberId: member1.id,
      cardNumber: "CARD-2024-001",
      issuedAt: new Date("2024-01-20T10:00:00Z"),
      expiresAt: new Date("2026-01-20T23:59:59Z"),
      status: "ISSUED",
      frontImageUrl: "/images/cards/card-001-front.jpg",
      backImageUrl: "/images/cards/card-001-back.jpg",
      qrData: JSON.stringify({ memberId: member1.id, cardNumber: "CARD-2024-001" }),
    },
  });

  await prisma.memberIdCard.create({
    data: {
      memberId: member2.id,
      cardNumber: "CARD-2024-002",
      issuedAt: new Date("2024-01-22T10:00:00Z"),
      expiresAt: new Date("2026-01-22T23:59:59Z"),
      status: "ISSUED",
      frontImageUrl: "/images/cards/card-002-front.jpg",
      backImageUrl: "/images/cards/card-002-back.jpg",
      qrData: JSON.stringify({ memberId: member2.id, cardNumber: "CARD-2024-002" }),
    },
  });

  await prisma.memberIdCard.create({
    data: {
      memberId: member3.id,
      cardNumber: "CARD-2024-003",
      status: "PRINTED",
      qrData: JSON.stringify({ memberId: member3.id, cardNumber: "CARD-2024-003" }),
    },
  });

  await prisma.memberIdCard.create({
    data: {
      memberId: member4.id,
      cardNumber: "CARD-2024-004",
      issuedAt: new Date("2024-01-25T10:00:00Z"),
      expiresAt: new Date("2027-01-25T23:59:59Z"), // VIP gets longer expiry
      status: "ISSUED",
      frontImageUrl: "/images/cards/card-004-front.jpg",
      backImageUrl: "/images/cards/card-004-back.jpg",
      qrData: JSON.stringify({ memberId: member4.id, cardNumber: "CARD-2024-004", tier: "VIP" }),
    },
  });

  await prisma.memberIdCard.create({
    data: {
      memberId: member5.id,
      cardNumber: "CARD-2024-005",
      status: "PENDING",
      qrData: JSON.stringify({ memberId: member5.id, cardNumber: "CARD-2024-005" }),
    },
  });

  console.log("Created member ID cards");

  console.log("Seeding finished successfully!");
  console.log("\n=== SEED DATA SUMMARY ===");
  console.log("Users created: 3 (1 admin, 2 members)");
  console.log("Member categories: 5");
  console.log("Members: 5");
  console.log("Dues plans: 5");
  console.log("Assigned dues: 4");
  console.log("Payments: 4");
  console.log("Activities: 4");
  console.log("Activity registrations: 7");
  console.log("Notifications: 5");
  console.log("ID cards: 5");
  console.log("\n=== LOGIN CREDENTIALS ===");
  console.log("Admin: username='admin', password='password123'");
  console.log("Member: username='ama.mensah', password='password123'");
  console.log("Member: username='kofi.adjei', password='password123'");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
