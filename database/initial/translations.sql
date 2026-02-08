CREATE TABLE translations (
  id INT UNSIGNED AUTO_INCREMENT,
  label VARCHAR(64) NOT NULL,
  lang CHAR(2) NOT NULL,
  string TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY translations_unique (label, lang)
) ENGINE=InnoDB CHARSET=utf8mb4;