-- 003_seed.sql
-- Populates CPE241_final_project with realistic test data.
-- {{HASH_ADMIN}}, {{HASH_MANAGER}}, {{HASH_CUSTOMER}} are substituted by 003_seed.js
-- before execution (bcrypt hashes of Admin@1234, Manager@1234, User@1234 respectively).

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM booking_items;
DELETE FROM booking;
DELETE FROM reserved_seats;
DELETE FROM showing;
DELETE FROM contain_seats;
DELETE FROM showtimes;
DELETE FROM seats;
DELETE FROM venues;
DELETE FROM users_profile;

ALTER TABLE users_profile  AUTO_INCREMENT = 1;
ALTER TABLE venues         AUTO_INCREMENT = 1;
ALTER TABLE seats          AUTO_INCREMENT = 1;
ALTER TABLE showtimes      AUTO_INCREMENT = 1;
ALTER TABLE showing        AUTO_INCREMENT = 1;
ALTER TABLE booking        AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Users (2 admins, 4 customers) ────────────────────────────────────────────

INSERT INTO users_profile (username, password, display_name, email, role, PDPA_status) VALUES
('admin',       '{{HASH_ADMIN}}',    'Admin User',     'admin@cinema.com',   'Admin',    TRUE),
('manager',     '{{HASH_MANAGER}}',  'Cinema Manager', 'manager@cinema.com', 'Admin',    TRUE),
('john_doe',    '{{HASH_CUSTOMER}}', 'John Doe',       'john@example.com',   'Customer', TRUE),
('jane_smith',  '{{HASH_CUSTOMER}}', 'Jane Smith',     'jane@example.com',   'Customer', TRUE),
('bob_wilson',  '{{HASH_CUSTOMER}}', 'Bob Wilson',     'bob@example.com',    'Customer', TRUE),
('alice_jones', '{{HASH_CUSTOMER}}', 'Alice Jones',    'alice@example.com',  'Customer', TRUE);

-- ─── Venues (3 halls) ─────────────────────────────────────────────────────────

INSERT INTO venues (venues_name, venues_address) VALUES
('CineMax Hall A',    '1 Cinema Boulevard, Bangkok'),
('StarPlex Hall B',   '45 Entertainment Avenue, Bangkok'),
('MegaScreen Hall C', '200 Movie Street, Bangkok');

-- ─── Seats (10 per venue = 30 total) ─────────────────────────────────────────
-- seat_ids 1-10  → Hall A
-- seat_ids 11-20 → Hall B
-- seat_ids 21-30 → Hall C

INSERT INTO seats (seat_number) VALUES
('A1'),('A2'),('A3'),('A4'),('A5'),('B1'),('B2'),('B3'),('B4'),('B5'),  -- 1-10
('A1'),('A2'),('A3'),('A4'),('A5'),('B1'),('B2'),('B3'),('B4'),('B5'),  -- 11-20
('A1'),('A2'),('A3'),('A4'),('A5'),('B1'),('B2'),('B3'),('B4'),('B5');  -- 21-30

-- ─── Seat ↔ Venue mapping ─────────────────────────────────────────────────────

INSERT INTO contain_seats (venues_id, seat_id) VALUES
(1,  1),(1,  2),(1,  3),(1,  4),(1,  5),(1,  6),(1,  7),(1,  8),(1,  9),(1, 10),
(2, 11),(2, 12),(2, 13),(2, 14),(2, 15),(2, 16),(2, 17),(2, 18),(2, 19),(2, 20),
(3, 21),(3, 22),(3, 23),(3, 24),(3, 25),(3, 26),(3, 27),(3, 28),(3, 29),(3, 30);

-- ─── Showtimes / Movies (6) ───────────────────────────────────────────────────

INSERT INTO showtimes (showtime_title, showtime_descript, duration, status, genre, poster_url, release_date, end_date) VALUES
('Avengers: Endgame',  'The Avengers make one final stand against Thanos.',           181, 'Open',             'Action',   NULL, '2019-04-26', NULL),
('The Dark Knight',    'Batman faces the Joker as Gotham spirals into chaos.',        152, 'Open',             'Action',   NULL, '2008-07-18', NULL),
('Inception',          'A thief enters dreams to plant an idea in a mark''s mind.',   148, 'Open',             'Sci-Fi',   NULL, '2010-07-16', NULL),
('Interstellar',       'Astronauts travel through a wormhole seeking a new home.',    169, 'Ended',            'Sci-Fi',   NULL, '2014-11-07', NULL),
('Parasite',           'A poor family schemes their way into a wealthy household.',   132, 'Hidden',           'Thriller', NULL, '2019-05-30', NULL),
('Oppenheimer',        'The story of J. Robert Oppenheimer and the atomic bomb.',     180, 'Upcoming',         'Drama',    NULL, '2023-07-21', NULL);

-- ─── Showings (8 slots across today and tomorrow) ────────────────────────────
-- show_id: 1=Avengers, 2=Dark Knight, 3=Inception, 4=Interstellar, 5=Parasite

INSERT INTO showing (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language) VALUES
(1, 1, 'Ontime', '2026-05-11', '10:00:00', '13:01:00', '2026-05-01', 'TH'),  -- 1: Avengers @ Hall A
(2, 1, 'Ontime', '2026-05-11', '14:00:00', '16:32:00', '2026-05-01', 'TH'),  -- 2: Dark Knight @ Hall A
(3, 2, 'Ontime', '2026-05-11', '10:00:00', '12:28:00', '2026-05-01', 'EN'),  -- 3: Inception @ Hall B
(4, 2, 'Full',   '2026-05-11', '14:00:00', '16:49:00', '2026-05-01', 'EN'),  -- 4: Interstellar @ Hall B (full)
(5, 3, 'Ontime', '2026-05-11', '10:00:00', '12:12:00', '2026-05-02', 'TH'),  -- 5: Parasite @ Hall C
(1, 3, 'Ontime', '2026-05-11', '14:00:00', '17:01:00', '2026-05-02', 'EN'),  -- 6: Avengers @ Hall C
(3, 1, 'Ontime', '2026-05-12', '10:00:00', '12:28:00', '2026-05-02', 'EN'),  -- 7: Inception @ Hall A (tomorrow)
(2, 2, 'Ontime', '2026-05-12', '14:00:00', '16:32:00', '2026-05-02', 'TH'); -- 8: Dark Knight @ Hall B (tomorrow)

-- ─── Reserved Seats (80 rows: 8 showings × 10 seats) ─────────────────────────
-- Status reflects current booking state (not initial Free — this is end-state seed data).

-- Showing 1 (Avengers @ Hall A): 4 Confirmed (bookings 1 & 2), 6 Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(1,  1, 'Confirmed', 250.00),(1,  2, 'Confirmed', 250.00),
(1,  3, 'Confirmed', 250.00),(1,  4, 'Confirmed', 250.00),
(1,  5, 'Free',      250.00),(1,  6, 'Free',      250.00),
(1,  7, 'Free',      250.00),(1,  8, 'Free',      250.00),
(1,  9, 'Free',      250.00),(1, 10, 'Free',      250.00);

-- Showing 2 (Dark Knight @ Hall A): 2 Reserved (booking 5 / Booking status), 8 Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(2,  1, 'Reserved', 250.00),(2,  2, 'Reserved', 250.00),
(2,  3, 'Free',     250.00),(2,  4, 'Free',     250.00),
(2,  5, 'Free',     250.00),(2,  6, 'Free',     250.00),
(2,  7, 'Free',     250.00),(2,  8, 'Free',     250.00),
(2,  9, 'Free',     250.00),(2, 10, 'Free',     250.00);

-- Showing 3 (Inception @ Hall B): 2 Confirmed (booking 3), 8 Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(3, 11, 'Confirmed', 250.00),(3, 12, 'Confirmed', 250.00),
(3, 13, 'Free',      250.00),(3, 14, 'Free',      250.00),
(3, 15, 'Free',      250.00),(3, 16, 'Free',      250.00),
(3, 17, 'Free',      250.00),(3, 18, 'Free',      250.00),
(3, 19, 'Free',      250.00),(3, 20, 'Free',      250.00);

-- Showing 4 (Interstellar @ Hall B, Full): all 10 Confirmed (booking 4)
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(4, 11, 'Confirmed', 300.00),(4, 12, 'Confirmed', 300.00),
(4, 13, 'Confirmed', 300.00),(4, 14, 'Confirmed', 300.00),
(4, 15, 'Confirmed', 300.00),(4, 16, 'Confirmed', 300.00),
(4, 17, 'Confirmed', 300.00),(4, 18, 'Confirmed', 300.00),
(4, 19, 'Confirmed', 300.00),(4, 20, 'Confirmed', 300.00);

-- Showing 5 (Parasite @ Hall C): 2 Reserved (booking 6 / Booking status), 8 Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(5, 21, 'Reserved', 250.00),(5, 22, 'Reserved', 250.00),
(5, 23, 'Free',     250.00),(5, 24, 'Free',     250.00),
(5, 25, 'Free',     250.00),(5, 26, 'Free',     250.00),
(5, 27, 'Free',     250.00),(5, 28, 'Free',     250.00),
(5, 29, 'Free',     250.00),(5, 30, 'Free',     250.00);

-- Showing 6 (Avengers @ Hall C): 2 Reserved (booking 7 / Checkout status), 8 Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(6, 21, 'Free',     250.00),(6, 22, 'Free',     250.00),
(6, 23, 'Reserved', 250.00),(6, 24, 'Reserved', 250.00),
(6, 25, 'Free',     250.00),(6, 26, 'Free',     250.00),
(6, 27, 'Free',     250.00),(6, 28, 'Free',     250.00),
(6, 29, 'Free',     250.00),(6, 30, 'Free',     250.00);

-- Showing 7 (Inception @ Hall A, tomorrow): all Free (booking 8 was Cancelled → seats released)
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(7,  1, 'Free', 250.00),(7,  2, 'Free', 250.00),
(7,  3, 'Free', 250.00),(7,  4, 'Free', 250.00),
(7,  5, 'Free', 250.00),(7,  6, 'Free', 250.00),
(7,  7, 'Free', 250.00),(7,  8, 'Free', 250.00),
(7,  9, 'Free', 250.00),(7, 10, 'Free', 250.00);

-- Showing 8 (Dark Knight @ Hall B, tomorrow): all Free
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price) VALUES
(8, 11, 'Free', 250.00),(8, 12, 'Free', 250.00),
(8, 13, 'Free', 250.00),(8, 14, 'Free', 250.00),
(8, 15, 'Free', 250.00),(8, 16, 'Free', 250.00),
(8, 17, 'Free', 250.00),(8, 18, 'Free', 250.00),
(8, 19, 'Free', 250.00),(8, 20, 'Free', 250.00);

-- ─── Bookings (8 rows across all statuses) ───────────────────────────────────
-- user_ids: 3=john_doe, 4=jane_smith, 5=bob_wilson, 6=alice_jones

INSERT INTO booking (user_id, showing_id, date, time, status, payment_proof_url) VALUES
(3, 1, '2026-05-10', '10:30:00', 'Successful', NULL),                              -- 1
(4, 1, '2026-05-10', '11:00:00', 'Successful', 'https://storage.example.com/proof/booking_2.jpg'), -- 2
(5, 3, '2026-05-10', '09:30:00', 'Successful', NULL),                              -- 3
(4, 4, '2026-05-10', '08:00:00', 'Successful', 'https://storage.example.com/proof/booking_4.jpg'), -- 4
(3, 2, '2026-05-11', '13:30:00', 'Booking',    NULL),                              -- 5
(6, 5, '2026-05-11', '09:00:00', 'Booking',    NULL),                              -- 6
(5, 6, '2026-05-11', '13:00:00', 'Checkout',   NULL),                              -- 7
(6, 7, '2026-05-11', '09:30:00', 'Cancel',     NULL);                              -- 8

-- ─── Booking Items ────────────────────────────────────────────────────────────

INSERT INTO booking_items (booking_id, seat_id) VALUES
-- Booking 1: showing 1 (Hall A), seats A1, A2
(1,  1),(1,  2),
-- Booking 2: showing 1 (Hall A), seats A3, A4
(2,  3),(2,  4),
-- Booking 3: showing 3 (Hall B), seats A1, A2
(3, 11),(3, 12),
-- Booking 4: showing 4 (Hall B, Full), all 10 seats
(4, 11),(4, 12),(4, 13),(4, 14),(4, 15),(4, 16),(4, 17),(4, 18),(4, 19),(4, 20),
-- Booking 5: showing 2 (Hall A), seats A1, A2  (status: Booking → Reserved)
(5,  1),(5,  2),
-- Booking 6: showing 5 (Hall C), seats A1, A2  (status: Booking → Reserved)
(6, 21),(6, 22),
-- Booking 7: showing 6 (Hall C), seats A3, A4  (status: Checkout → Reserved)
(7, 23),(7, 24),
-- Booking 8: showing 7 (Hall A), seats A1, A2  (status: Cancel → Free)
(8,  1),(8,  2);
