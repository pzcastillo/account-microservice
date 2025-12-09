Setup:

1. Run Terminal as administrator.
2. Change file path to folder of program (cd [insert file path]).
3. Input 'npm run dev' and wait for 'Account service listening on port 3000'.
4. Open SQL Shell (psql) and login using database name and postgres username & password.
5. (For blank databases) run "...account-microservice\sql\ddl.sql" to create tables, user types, roles, permissions, and default department.
6. After running the .sql file, input the following in psql to create Super Admin:
   
   INSERT INTO accounts (
     id,
     fullname,
     username,
     email,
     password_hash,
     role_id,
     user_type_id,
     status,
     comp_code
   )
   VALUES (
    '11111111-1111-1111-1111-111111111111',                          -- fixed UUID for ease, gen_random_uuid() for random
    'Super Admin',
    'superadmin',
    'superadmin@company.com',                                        -- or whatever super admin email is
    '$2b$10$6b5q2g8f9k1m3n5p7r9t1uJ5v8w2x4y6z0A1B3C5D7E9F1G2H4I6J',  -- password = "admin123" or whatever hashed password
    (SELECT id FROM roles WHERE role_name = 'SUPER_ADMIN'),
    (SELECT id FROM user_types WHERE type_name = 'Admin'),
    'active',
    'LEGACY'                                                         -- or whatever the real company code is
   );

   (Optional) create admin for first company:

   -- Create first admin for Company "Comp1"
   INSERT INTO accounts (
     id, fullname, username, email, password_hash, role_id, user_type_id, status, comp_code
   ) VALUES (
     uuid_generate_v4(),
     'AdminComp1',
     'admin.comp1',
     'admin@comp1.com',
     '$2b$10$6b5q2g8f9k1m3n5p7r9t1uJ5v8w2x4y6z0A1B3C5D7E9F1G2H4I6J',  -- admin123
     (SELECT id FROM roles WHERE role_name = 'ADMIN'),
     (SELECT id FROM user_types WHERE type_name = 'Admin'),
     'active',
     'COMP1'               -- real company code
   );

7. Login (http://localhost:3000/docs/) using Super Admin or Admin token to create other accounts and departments.