CREATE TABLE ribbons (
  id INT UNSIGNED AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  glyph_id INT UNSIGNED NOT NULL,
  no_wings BOOLEAN NOT NULL DEFAULT FALSE,
  ordering int unsigned DEFAULT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (glyph_id) REFERENCES glyphs(id)
) ENGINE=InnoDB CHARSET=utf8mb4;