categories | CREATE TABLE categories (
  id int unsigned NOT NULL AUTO_INCREMENT,
  background varchar(32) NOT NULL,
  stripes varchar(32) NOT NULL,
  glyph varchar(32) NOT NULL,
  wing1 varchar(32) NOT NULL,
  wing2 varchar(32) NOT NULL,
  ordering int unsigned DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8mb4;