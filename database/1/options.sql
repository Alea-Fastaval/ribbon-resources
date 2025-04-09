CREATE TABLE options (
  id INT UNSIGNED AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY options (name)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO options (name, value) VALUES ('show_closed_message', 'false');