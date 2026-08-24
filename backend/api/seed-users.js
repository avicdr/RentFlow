const mongoose = require('mongoose');
const argon2 = require('argon2');
const { Schema } = mongoose;

const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  passwordHash: String,
  phone: String,
  role: String,
  status: { type: String, default: 'ACTIVE' },
  isEmailVerified: { type: Boolean, default: true },
  isKycVerified: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true, collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rentflow');
    console.log('Connected to MongoDB');

    const passwordHash = await argon2.hash('Password@123', {
      type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
    });

    const users = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@rentflow.com',
        passwordHash,
        phone: '9999999990',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true
      },
      {
        firstName: 'Leo',
        lastName: 'Landlord',
        email: 'landlord@rentflow.com',
        passwordHash,
        phone: '9999999991',
        role: 'LANDLORD',
        status: 'ACTIVE',
        isEmailVerified: true
      },
      {
        firstName: 'Tom',
        lastName: 'Tenant',
        email: 'tenant@rentflow.com',
        passwordHash,
        phone: '9999999992',
        role: 'TENANT',
        status: 'ACTIVE',
        isEmailVerified: true
      }
    ];

    for (const u of users) {
      await User.deleteOne({ email: u.email });
      await User.create(u);
      console.log(`Created user: ${u.email} (${u.role})`);  // Default password set in script
    }

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
