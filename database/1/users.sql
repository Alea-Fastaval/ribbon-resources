CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT,
  participant_id INT UNSIGNED,
  year INT UNSIGNED,
  name TEXT,
  email TEXT,
  PRIMARY KEY (id),
  UNIQUE KEY users_participant_year (participant_id, year)
) ENGINE=InnoDB CHARSET=utf8mb4;