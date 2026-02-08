CREATE TABLE ribbon_orders (
  id INT UNSIGNED AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  ribbon_id INT UNSIGNED NOT NULL,
  grunt INT UNSIGNED NOT NULL DEFAULT 0,
  second INT UNSIGNED NOT NULL DEFAULT 0,
  leader INT UNSIGNED NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (ribbon_id) REFERENCES ribbons(id),
  UNIQUE KEY ribbon_orders_user_ribbon (user_id, ribbon_id)
) ENGINE=InnoDB CHARSET=utf8mb4;