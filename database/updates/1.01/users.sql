ALTER TABLE users ADD display_name text NOT NULL;
UPDATE users SET display_name = "";