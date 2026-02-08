CREATE TABLE special_rules (
  id INT UNSIGNED AUTO_INCREMENT,
  ribbon_id INT UNSIGNED,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (ribbon_id) REFERENCES ribbons(id)
) ENGINE=InnoDB CHARSET=utf8mb4;

INSERT INTO special_rules (ribbon_id, name, value) VALUES (,"glyph_color","#cccccc"); -- For the silver dragon
INSERT INTO special_rules (ribbon_id, name, value) VALUES (,"always_wings","2,1"); -- For Scenario Discussion Partner
INSERT INTO special_rules (ribbon_id, name, value) VALUES (,"always_wings","1,2"); -- For Other Activities