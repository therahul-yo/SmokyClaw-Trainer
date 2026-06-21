-- Employees seed DB
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

INSERT INTO departments (id, name, location) VALUES
  (1, 'Engineering', 'Bangalore'),
  (2, 'Sales',       'Chennai'),
  (3, 'Marketing',   'Mumbai'),
  (4, 'Finance',     'Delhi'),
  (5, 'HR',          'Pune');
-- Note: HR intentionally has no employees (anti-join drills depend on it).

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL,
  hired_at TEXT NOT NULL
);

INSERT INTO employees (id, name, department, department_id, salary, hired_at) VALUES
  (1, 'Alice',   'Engineering', 1, 75000, '2023-05-14'),
  (2, 'Bob',     'Sales',       2, 45000, '2024-01-09'),
  (3, 'Carol',   'Engineering', 1, 92000, '2022-08-30'),
  (4, 'Dave',    'Sales',       2, 48000, '2024-06-12'),
  (5, 'Eve',     'Marketing',   3, 38000, '2025-02-01'),
  (6, 'Frank',   NULL,          NULL, 30000, '2025-04-15'),
  (7, 'Grace',   'Finance',     4, 65000, '2023-11-20'),
  (8, 'Hugo',    'Engineering', 1, 50000, '2024-09-05');
