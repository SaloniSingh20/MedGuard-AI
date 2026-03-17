const mongoose = require('mongoose');
require('dotenv').config();

// Medicine schema
const medicineSchema = new mongoose.Schema({
  medicine_id: String,
  name: String,
  manufacturer: String,
  batch_number: String,
  qr_code: String,
  manufacture_date: Date,
  expiry_date: Date,
  authentic_packaging_image: String
});

const Medicine = mongoose.model('Medicine', medicineSchema);

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medguard');

    const demoMedicines = [
      {
        medicine_id: 'MED001',
        name: 'Paracetamol',
        manufacturer: 'PharmaCorp',
        batch_number: 'BATCH2024001',
        qr_code: 'QR123456789',
        manufacture_date: new Date('2024-01-15'),
        expiry_date: new Date('2026-01-15'),
        authentic_packaging_image: 'paracetamol_ref.jpg'
      },
      {
        medicine_id: 'MED002',
        name: 'Amoxicillin',
        manufacturer: 'MediLab',
        batch_number: 'BATCH2024002',
        qr_code: 'QR987654321',
        manufacture_date: new Date('2024-02-01'),
        expiry_date: new Date('2025-02-01'),
        authentic_packaging_image: 'amoxicillin_ref.jpg'
      },
      {
        medicine_id: 'MED003',
        name: 'Ibuprofen',
        manufacturer: 'HealthPharm',
        batch_number: 'BATCH2024003',
        qr_code: 'QR456789123',
        manufacture_date: new Date('2024-03-01'),
        expiry_date: new Date('2026-03-01'),
        authentic_packaging_image: 'ibuprofen_ref.jpg'
      }
    ];

    await Medicine.insertMany(demoMedicines);
    console.log('Demo medicines added successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();