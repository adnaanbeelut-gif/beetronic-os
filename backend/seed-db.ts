import db from './src/config/database';
import { hashPassword } from './src/utils/auth';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...');

  try {
    // Get admin role for test user
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as { id: string };

    if (!adminRole) {
      console.error('❌ Admin role not found');
      process.exit(1);
    }

    // Create test user as admin
    const userId = uuidv4();
    const passwordHash = await hashPassword('password');

    db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'user@example.com', passwordHash, 'Test', 'User', adminRole.id, 1);

    console.log('✅ Test user created:');
    console.log('   Email: user@example.com');
    console.log('   Password: password');
    console.log('');
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
