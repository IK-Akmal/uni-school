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
  amount REAL NOT NULL,
  group_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  course_price_at_payment REAL NOT NULL,
  payment_period TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'regular',
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES group_entity(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_balance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  expected_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  last_updated DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_entity(id) ON DELETE CASCADE,
  UNIQUE(student_id, group_id, period)
);
