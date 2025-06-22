CREATE TABLE IF NOT EXISTS group_entity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  course_price REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  payment_due INTEGER NOT NULL,
  address TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_group (
  student_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (student_id, group_id),
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_entity(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS student_payment (
  student_id INTEGER NOT NULL,
  payment_id INTEGER NOT NULL,
  PRIMARY KEY (student_id, payment_id),
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE CASCADE
);
