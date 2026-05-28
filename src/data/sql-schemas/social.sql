-- Social seed DB — designed for window-function, CTE and graph-flavored SQL drills.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  joined_at TEXT NOT NULL
);

INSERT INTO users (id, username, country, joined_at) VALUES
  (1, 'aarav',   'IN', '2023-01-05'),
  (2, 'bhavna',  'IN', '2023-02-10'),
  (3, 'chetan',  'IN', '2023-03-15'),
  (4, 'divya',   'US', '2023-04-20'),
  (5, 'esha',    'IN', '2023-05-25'),
  (6, 'farhan',  'UK', '2023-06-30'),
  (7, 'gita',    'IN', '2023-07-12'),
  (8, 'harsh',   'US', '2023-08-18');

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  posted_at TEXT NOT NULL
);

INSERT INTO posts (id, user_id, body, posted_at) VALUES
  (1, 1, 'hello world',              '2024-01-01'),
  (2, 1, 'another post',             '2024-01-03'),
  (3, 2, 'good morning',             '2024-01-02'),
  (4, 2, 'lunch was great',          '2024-01-04'),
  (5, 2, 'evening walk',             '2024-01-08'),
  (6, 3, 'first post',               '2024-01-05'),
  (7, 4, 'travel diary 1',           '2024-01-06'),
  (8, 4, 'travel diary 2',           '2024-01-07'),
  (9, 5, 'product launch',           '2024-01-09'),
  (10,5, 'follow-up',                '2024-01-12'),
  (11,6, 'london is rainy',          '2024-01-10'),
  (12,7, 'photo dump',               '2024-01-11'),
  (13,8, 'startup grind',            '2024-01-13'),
  (14,8, 'shipping day',             '2024-01-14'),
  (15,8, 'launched!',                '2024-01-15');

CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id),
  followee_id INTEGER NOT NULL REFERENCES users(id),
  followed_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);

INSERT INTO follows (follower_id, followee_id, followed_at) VALUES
  (1, 2, '2024-01-01'),
  (1, 3, '2024-01-01'),
  (2, 1, '2024-01-02'),
  (2, 5, '2024-01-03'),
  (3, 1, '2024-01-04'),
  (4, 1, '2024-01-05'),
  (4, 5, '2024-01-05'),
  (5, 1, '2024-01-06'),
  (5, 2, '2024-01-06'),
  (6, 4, '2024-01-07'),
  (7, 5, '2024-01-08'),
  (8, 5, '2024-01-09'),
  (8, 1, '2024-01-09');

CREATE TABLE likes (
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  liked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

INSERT INTO likes (user_id, post_id, liked_at) VALUES
  (2, 1,  '2024-01-01'),
  (3, 1,  '2024-01-01'),
  (4, 1,  '2024-01-02'),
  (5, 1,  '2024-01-02'),
  (1, 3,  '2024-01-02'),
  (1, 4,  '2024-01-04'),
  (3, 9,  '2024-01-09'),
  (4, 9,  '2024-01-09'),
  (5, 13, '2024-01-13'),
  (6, 13, '2024-01-13'),
  (7, 13, '2024-01-13'),
  (8, 9,  '2024-01-10'),
  (1, 15, '2024-01-15'),
  (2, 15, '2024-01-15'),
  (5, 15, '2024-01-15');
