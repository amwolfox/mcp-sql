-- Initialize database and insert dummy data for development
-- Enable case-insensitive text type
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS employee (
  id SERIAL PRIMARY KEY,
  name CITEXT,
  age INT,
  email CITEXT
);

CREATE TABLE IF NOT EXISTS address (
  id SERIAL PRIMARY KEY,
  city CITEXT,
  state CITEXT,
  employee_id INT[]
);

-- Insert sample employees
INSERT INTO employee (name, age, email) VALUES
  ('Alice', 30, 'alice@example.com'),
  ('Bob', 28, 'bob@example.com'),
  ('Carol', 35, 'carol@example.com'),
  ('David', 40, 'david@example.com'),
  ('Eve', 26, 'eve@example.com'),
  ('Frank', 32, 'frank@example.com'),
  ('Grace', 29, 'grace@example.com'),
  ('Heidi', 31, 'heidi@example.com'),
  ('Ivan', 45, 'ivan@example.com'),
  ('Judy', 27, 'judy@example.com'),
  ('Karl', 38, 'karl@example.com'),
  ('Liam', 24, 'liam@example.com'),
  ('Mia', 33, 'mia@example.com'),
  ('Noah', 36, 'noah@example.com'),
  ('Olivia', 34, 'olivia@example.com')
ON CONFLICT DO NOTHING;

-- Insert sample addresses (employee_id as array)
INSERT INTO address (city, state, employee_id) VALUES
  ('Seattle', 'WA', ARRAY[1]),
  ('Austin', 'TX', ARRAY[2,3]),
  ('New York', 'NY', ARRAY[4]),
  ('San Francisco', 'CA', ARRAY[5,6]),
  ('Denver', 'CO', ARRAY[7]),
  ('Chicago', 'IL', ARRAY[8,9]),
  ('Boston', 'MA', ARRAY[10]),
  ('Miami', 'FL', ARRAY[11,12,13]),
  ('Portland', 'OR', ARRAY[14,15])
ON CONFLICT DO NOTHING;
