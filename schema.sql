CREATE TABLE IF NOT EXISTS couples (
  code TEXT NOT NULL,
  role TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (code, role)
);
