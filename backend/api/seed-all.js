const mongoose = require('mongoose');
const argon2 = require('argon2');

const placeholder1 = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23eef2ff%22%2F%3E%3Cpath%20d%3D%22M400%20150%20L200%20350%20L600%20350%20Z%22%20fill%3D%22%23818cf8%22%2F%3E%3Crect%20x%3D%22250%22%20y%3D%22350%22%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%236366f1%22%2F%3E%3Crect%20x%3D%22350%22%20y%3D%22450%22%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23c7d2fe%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22100%22%20font-family%3D%22sans-serif%22%20font-size%3D%2240%22%20fill%3D%22%234f46e5%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3ESunrise%20Apartments%3C%2Ftext%3E%3C%2Fsvg%3E';
const placeholder2 = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23f0fdf4%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%22200%22%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%2322c55e%22%2F%3E%3Crect%20x%3D%22250%22%20y%3D%22250%22%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23bbf7d0%22%2F%3E%3Crect%20x%3D%22450%22%20y%3D%22250%22%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23bbf7d0%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22100%22%20font-family%3D%22sans-serif%22%20font-size%3D%2240%22%20fill%3D%22%23166534%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3EGreen%20Leaf%20Hostel%3C%2Ftext%3E%3C%2Fsvg%3E';
const dummyPdf = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjwwCiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkJICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgpUago4MCAwIFRECmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNDkgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQzOQolJUVPRgo=';

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rentflow');
    console.log('Connected to MongoDB');

    const User = mongoose.connection.collection('users');
    const Tenant = mongoose.connection.collection('tenants');
    const Property = mongoose.connection.collection('properties');
    const Room = mongoose.connection.collection('rooms');
    const Bed = mongoose.connection.collection('beds');
    const Lease = mongoose.connection.collection('leases');
    const Payment = mongoose.connection.collection('payments');
    const Complaint = mongoose.connection.collection('complaints');
    const Notification = mongoose.connection.collection('notifications');
    const Listing = mongoose.connection.collection('listings');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}), Tenant.deleteMany({}), Property.deleteMany({}),
      Room.deleteMany({}), Bed.deleteMany({}), Lease.deleteMany({}),
      Payment.deleteMany({}), Complaint.deleteMany({}), Listing.deleteMany({}), Notification.deleteMany({})
    ]);

    const passwordHash = await argon2.hash('Password@123', {
      type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
    });

    const now = new Date();
    const adminId = new mongoose.Types.ObjectId();
    const landlordId = new mongoose.Types.ObjectId();
    const orgId = new mongoose.Types.ObjectId(); // Orgnization ID matching landlordId for simplicity
    
    const tenant1Id = new mongoose.Types.ObjectId();
    const tenant2Id = new mongoose.Types.ObjectId();
    const tenant3Id = new mongoose.Types.ObjectId();

    await User.insertMany([
      { _id: adminId, firstName: 'Super', lastName: 'Admin', email: 'admin@rentflow.com', passwordHash, role: 'SUPER_ADMIN', status: 'ACTIVE', isEmailVerified: true, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: landlordId, firstName: 'Leo', lastName: 'Landlord', email: 'landlord@rentflow.com', passwordHash, role: 'LANDLORD', status: 'ACTIVE', isEmailVerified: true, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: tenant1Id, firstName: 'Tom', lastName: 'Tenant', email: 'tenant@rentflow.com', passwordHash, role: 'TENANT', status: 'ACTIVE', isEmailVerified: true, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: tenant2Id, firstName: 'Jane', lastName: 'Doe', email: 'jane@rentflow.com', passwordHash, role: 'TENANT', status: 'ACTIVE', isEmailVerified: true, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: tenant3Id, firstName: 'John', lastName: 'Smith', email: 'john@rentflow.com', passwordHash, role: 'TENANT', status: 'ACTIVE', isEmailVerified: true, isDeleted: false, createdAt: now, updatedAt: now }
    ]);
    console.log('Users created');

    // PROPERTIES
    const prop1Id = new mongoose.Types.ObjectId();
    const prop2Id = new mongoose.Types.ObjectId();

    await Property.insertMany([
      {
        _id: prop1Id,
        landlordId,
        organizationId: landlordId,
        name: 'Sunrise Apartments',
        description: 'Premium living spaces located in the heart of the city. Perfect for young professionals.',
        type: 'APARTMENT',
        address: { line1: '123 Main St', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', country: 'India' },
        amenities: { wifi: true, powerBackup: true, parking: true, cctv: true, security: true, gym: true },
        images: [placeholder1],
        status: 'ACTIVE',
        totalRooms: 3,
        totalBeds: 6,
        occupiedBeds: 3,
        isDeleted: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: prop2Id,
        landlordId,
        organizationId: landlordId,
        name: 'Green Leaf Hostel',
        description: 'Affordable and clean hostel living for students and interns.',
        type: 'HOSTEL',
        address: { line1: '45 College Rd', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India' },
        amenities: { wifi: true, parking: false, cctv: true, security: true, laundry: true },
        images: [placeholder2],
        status: 'ACTIVE',
        totalRooms: 2,
        totalBeds: 8,
        occupiedBeds: 0,
        isDeleted: false,
        createdAt: now, updatedAt: now
      }
    ]);
    console.log('Properties created');

    // ROOMS
    const p1r1Id = new mongoose.Types.ObjectId(); // Sunrise - Solo
    const p1r2Id = new mongoose.Types.ObjectId(); // Sunrise - Double
    const p1r3Id = new mongoose.Types.ObjectId(); // Sunrise - Triple
    
    const p2r1Id = new mongoose.Types.ObjectId(); // Green Leaf - Quad

    await Room.insertMany([
      { _id: p1r1Id, propertyId: prop1Id, roomNumber: '101', floor: 1, type: 'SINGLE', capacity: 1, monthlyRent: 25000, rentPerBed: 25000, occupiedCount: 1, status: 'OCCUPIED', isDeleted: false, createdAt: now, updatedAt: now },
      { _id: p1r2Id, propertyId: prop1Id, roomNumber: '102', floor: 1, type: 'DOUBLE', capacity: 2, monthlyRent: 30000, rentPerBed: 15000, occupiedCount: 1, status: 'PARTIALLY_OCCUPIED', isDeleted: false, createdAt: now, updatedAt: now },
      { _id: p1r3Id, propertyId: prop1Id, roomNumber: '201', floor: 2, type: 'TRIPLE', capacity: 3, monthlyRent: 30000, rentPerBed: 10000, occupiedCount: 1, status: 'PARTIALLY_OCCUPIED', isDeleted: false, createdAt: now, updatedAt: now },
      { _id: p2r1Id, propertyId: prop2Id, roomNumber: 'A1', floor: 1, type: 'QUAD', capacity: 4, monthlyRent: 24000, rentPerBed: 6000, occupiedCount: 0, status: 'AVAILABLE', isDeleted: false, createdAt: now, updatedAt: now }
    ]);

    // BEDS
    const bedDocs = [];
    let bedCounter = 1;
    const makeBeds = (roomId, propId, capacity, occupiedByArr) => {
      for(let i=0; i<capacity; i++) {
        const tenant = occupiedByArr[i] || null;
        bedDocs.push({
          _id: new mongoose.Types.ObjectId(),
          roomId, propertyId: propId,
          bedIdentifier: `B${bedCounter++}`,
          status: tenant ? 'OCCUPIED' : 'AVAILABLE',
          currentTenantId: tenant,
          isDeleted: false,
          createdAt: now, updatedAt: now
        });
      }
    };

    makeBeds(p1r1Id, prop1Id, 1, [tenant1Id]);
    makeBeds(p1r2Id, prop1Id, 2, [tenant2Id]);
    makeBeds(p1r3Id, prop1Id, 3, [tenant3Id]);
    makeBeds(p2r1Id, prop2Id, 4, []);

    await Bed.insertMany(bedDocs);
    console.log('Rooms and Beds created');

    // TENANTS & LEASES
    const tProfile1 = new mongoose.Types.ObjectId();
    const tProfile2 = new mongoose.Types.ObjectId();
    const tProfile3 = new mongoose.Types.ObjectId();

    await Tenant.insertMany([
      { _id: tProfile1, userId: tenant1Id, propertyId: prop1Id, roomId: p1r1Id, bedId: bedDocs[0]._id, landlordId, status: 'ACTIVE', joiningDate: new Date('2024-01-01'), agreedRent: 25000, securityDeposit: 50000, rentDueDay: 1, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: tProfile2, userId: tenant2Id, propertyId: prop1Id, roomId: p1r2Id, bedId: bedDocs[1]._id, landlordId, status: 'ACTIVE', joiningDate: new Date('2024-02-01'), agreedRent: 15000, securityDeposit: 30000, rentDueDay: 1, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: tProfile3, userId: tenant3Id, propertyId: prop1Id, roomId: p1r3Id, bedId: bedDocs[3]._id, landlordId, status: 'ACTIVE', joiningDate: new Date('2024-03-01'), agreedRent: 10000, securityDeposit: 20000, rentDueDay: 1, isDeleted: false, createdAt: now, updatedAt: now }
    ]);

    await Lease.insertMany([
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile1, propertyId: prop1Id, roomId: p1r1Id, bedId: bedDocs[0]._id, landlordId, startDate: new Date('2024-01-01'), endDate: new Date('2025-01-01'), rentAmount: 25000, securityDeposit: 50000, status: 'ACTIVE', terms: ['No smoking'], documentUrl: dummyPdf, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile2, propertyId: prop1Id, roomId: p1r2Id, bedId: bedDocs[1]._id, landlordId, startDate: new Date('2024-02-01'), endDate: new Date('2025-02-01'), rentAmount: 15000, securityDeposit: 30000, status: 'ACTIVE', terms: ['No pets'], documentUrl: dummyPdf, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile3, propertyId: prop1Id, roomId: p1r3Id, bedId: bedDocs[3]._id, landlordId, startDate: new Date('2024-03-01'), endDate: new Date('2025-03-01'), rentAmount: 10000, securityDeposit: 20000, status: 'ACTIVE', terms: [], documentUrl: dummyPdf, isDeleted: false, createdAt: now, updatedAt: now }
    ]);
    console.log('Tenants and Leases created');

    // PAYMENTS
    await Payment.insertMany([
      // Tenant 1 Paid
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile1, propertyId: prop1Id, landlordId, amount: 25000, type: 'RENT', status: 'PAID', month: now.getMonth()+1, year: now.getFullYear(), dueDate: now, paidDate: now, paymentMethod: 'UPI', submission: { utrNumber: 'UPI123456', receiptUrl: dummyPdf }, isDeleted: false, createdAt: now, updatedAt: now },
      // Tenant 2 Pending Approval
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile2, propertyId: prop1Id, landlordId, amount: 15000, type: 'RENT', status: 'PAYMENT_SUBMITTED', month: now.getMonth()+1, year: now.getFullYear(), dueDate: now, paymentMethod: 'BANK_TRANSFER', submission: { utrNumber: 'BANK001', submittedAt: now }, isDeleted: false, createdAt: now, updatedAt: now },
      // Tenant 3 Paid
      { _id: new mongoose.Types.ObjectId(), tenantId: tProfile3, propertyId: prop1Id, landlordId, amount: 10000, type: 'RENT', status: 'PAID', month: now.getMonth()+1, year: now.getFullYear(), dueDate: now, paidDate: now, paymentMethod: 'CASH', isDeleted: false, createdAt: now, updatedAt: now }
    ]);
    console.log('Payments created');

    // COMPLAINTS
    await Complaint.insertMany([
      { _id: new mongoose.Types.ObjectId(), raisedBy: tenant1Id, raisedByRole: 'TENANT', propertyId: prop1Id, roomId: p1r1Id, landlordId, organizationId: landlordId, title: 'AC not cooling', description: 'The AC in room 101 is blowing hot air.', category: 'MAINTENANCE', priority: 'HIGH', status: 'OPEN', timeline: [{ action: 'OPENED', performedBy: tenant1Id, timestamp: now }], isDeleted: false, createdAt: now, updatedAt: now },
      { _id: new mongoose.Types.ObjectId(), raisedBy: tenant2Id, raisedByRole: 'TENANT', propertyId: prop1Id, roomId: p1r2Id, landlordId, organizationId: landlordId, title: 'WiFi dropped', description: 'No internet since morning.', category: 'WIFI', priority: 'MEDIUM', status: 'RESOLVED', timeline: [{ action: 'OPENED', performedBy: tenant2Id, timestamp: new Date(now.getTime()-86400000) }, { action: 'RESOLVED', performedBy: landlordId, timestamp: now, comment: 'Router restarted.' }], isDeleted: false, createdAt: now, updatedAt: now }
    ]);
    console.log('Complaints created');

    // NOTIFICATIONS
    await Notification.insertMany([
      { _id: new mongoose.Types.ObjectId(), userId: landlordId, type: 'SYSTEM', title: 'Welcome to RentFlow', body: 'Your dashboard is fully set up!', isRead: false, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: new mongoose.Types.ObjectId(), userId: landlordId, type: 'PAYMENT_RECEIVED', title: 'Payment Submitted', body: 'Jane Doe has submitted a rent payment for approval.', isRead: false, isDeleted: false, createdAt: now, updatedAt: now },
      { _id: new mongoose.Types.ObjectId(), userId: tenant1Id, type: 'SYSTEM', title: 'Lease Activated', body: 'Your lease for Sunrise Apartments is now active.', isRead: false, isDeleted: false, createdAt: now, updatedAt: now }
    ]);

    // Update Listing Module - Since Listings module handles everything dynamically now via aggregations, we don't need to manually insert into the listings collection!
    console.log('Seeding complete! You can now log in.');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
