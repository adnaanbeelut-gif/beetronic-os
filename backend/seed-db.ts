import db from './src/config/database';
import { hashPassword } from './src/utils/auth';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...');

  try {
    // Get user role
    const userRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('user') as { id: string };

    if (!userRole) {
      console.error('❌ User role not found');
      process.exit(1);
    }

    // Create test user
    const userId = uuidv4();
    const passwordHash = await hashPassword('password');

    db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'user@example.com', passwordHash, 'Test', 'User', userRole.id, 1);

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
