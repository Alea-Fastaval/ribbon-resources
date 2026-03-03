-- Reduce length of existing columns
ALTER TABLE categories MODIFY COLUMN background VARCHAR(7) NOT NULL;
ALTER TABLE categories MODIFY COLUMN stripes VARCHAR(7) NOT NULL;
ALTER TABLE categories MODIFY COLUMN glyph VARCHAR(7) NOT NULL;
ALTER TABLE categories MODIFY COLUMN wing1 VARCHAR(7) NOT NULL;
ALTER TABLE categories MODIFY COLUMN wing2 VARCHAR(7) NOT NULL;

-- Add new columns
ALTER TABLE categories ADD COLUMN retired_side ENUM('top', 'bottom') NOT NULL;
ALTER TABLE categories ADD COLUMN retired_color VARCHAR(7) NOT NULL;

