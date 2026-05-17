-- E-commerce seed DB
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  joined_at TEXT NOT NULL
);

INSERT INTO customers (id, name, city, joined_at) VALUES
  (1, 'Riya',   'Mumbai',    '2024-01-15'),
  (2, 'Arjun',  'Bangalore', '2024-02-20'),
  (3, 'Kavya',  'Chennai',   '2024-03-10'),
  (4, 'Sahil',  'Mumbai',    '2024-05-05');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);

INSERT INTO products (id, name, category, price) VALUES
  (1, 'Laptop',       'electronics', 60000),
  (2, 'Phone',        'electronics', 25000),
  (3, 'Book',         'books',         500),
  (4, 'Headphones',   'electronics',  3000),
  (5, 'Notebook',     'stationery',    150);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  placed_at TEXT NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO orders (id, customer_id, placed_at, status) VALUES
  (1, 1, '2024-06-01', 'delivered'),
  (2, 2, '2024-06-15', 'delivered'),
  (3, 1, '2024-07-04', 'shipped'),
  (4, 3, '2024-07-10', 'cancelled'),
  (5, 4, '2024-08-22', 'delivered');

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL
);

INSERT INTO order_items (id, order_id, product_id, quantity) VALUES
  (1, 1, 1, 1),
  (2, 1, 4, 2),
  (3, 2, 2, 1),
  (4, 3, 3, 3),
  (5, 4, 5, 5),
  (6, 5, 1, 2);
