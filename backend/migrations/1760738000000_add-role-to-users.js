/**
 * Migration: Add role column to users table
 *
 * Adds role-based access control to the platform:
 * - super_admin: Platform administrator (EasySmart)
 * - tenant_admin: Tenant administrator (Client)
 * - user: Regular user (Client employee)
 *
 * Phase: 2.1.5
 * Date: 2025-10-17
 */

exports.up = async (pgm) => {
  // Add role column with default 'user'
  pgm.addColumn('users', {
    role: {
      type: 'TEXT',
      notNull: true,
      default: 'user',
    },
  });

  // Add check constraint to ensure valid roles
  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('super_admin', 'tenant_admin', 'user')",
  });

  // Create index for faster role-based queries
  pgm.createIndex('users', 'role');

  // Update existing admin user to super_admin (if exists)
  pgm.sql(`
    UPDATE users 
    SET role = 'super_admin' 
    WHERE email = 'admin@easysmart.io'
  `);

  // Set all other existing users as tenant_admin (they created their tenants)
  pgm.sql(`
    UPDATE users 
    SET role = 'tenant_admin' 
    WHERE email != 'admin@easysmart.io'
  `);

  // Add comment to column
  pgm.sql(`
    COMMENT ON COLUMN users.role IS 'User role: super_admin (platform admin), tenant_admin (tenant admin), user (regular user)'
  `);
};

exports.down = async (pgm) => {
  // Remove index
  pgm.dropIndex('users', 'role');

  // Remove constraint
  pgm.dropConstraint('users', 'users_role_check');

  // Remove column
  pgm.dropColumn('users', 'role');
};
