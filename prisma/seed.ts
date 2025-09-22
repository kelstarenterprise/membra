import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clean existing data (optional, for development)
  await prisma.member.deleteMany();
  await prisma.memberCategory.deleteMany();
  console.log("Deleted existing members and categories");

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

  console.log("Seeding finished.");
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
