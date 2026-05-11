-- 003_seed.sql
-- Populates CPE241_final_project with realistic demo data.
-- {{HASH_ADMIN}}, {{HASH_MANAGER}}, {{HASH_CUSTOMER}} are substituted by 003_seed.js
-- before execution (bcrypt hashes of Admin@1234, Manager@1234, User@1234 respectively).
--
-- Data shape goal:
-- - 4 venues, each with 40 seats
-- - 12 movies/showtimes with mixed lifecycle statuses
-- - Showings spread across the previous months + near future
-- - High showing density around today (last week to next week)
-- - Booking records across all statuses (Booking / Checkout / Successful / Cancel)

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

ALTER TABLE users_profile AUTO_INCREMENT = 1;
ALTER TABLE venues AUTO_INCREMENT = 1;
ALTER TABLE seats AUTO_INCREMENT = 1;
ALTER TABLE showtimes AUTO_INCREMENT = 1;
ALTER TABLE showing AUTO_INCREMENT = 1;
ALTER TABLE booking AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Users
INSERT INTO users_profile (username, password, display_name, email, role, PDPA_status) VALUES
('admin', '{{HASH_ADMIN}}', 'Admin User', 'admin@cinema.com', 'Admin', TRUE),
('manager', '{{HASH_MANAGER}}', 'Cinema Manager', 'manager@cinema.com', 'Admin', TRUE),
('john_doe', '{{HASH_CUSTOMER}}', 'John Doe', 'john@example.com', 'Customer', TRUE),
('jane_smith', '{{HASH_CUSTOMER}}', 'Jane Smith', 'jane@example.com', 'Customer', TRUE),
('bob_wilson', '{{HASH_CUSTOMER}}', 'Bob Wilson', 'bob@example.com', 'Customer', TRUE),
('alice_jones', '{{HASH_CUSTOMER}}', 'Alice Jones', 'alice@example.com', 'Customer', TRUE),
('mike_chan', '{{HASH_CUSTOMER}}', 'Mike Chan', 'mike@example.com', 'Customer', TRUE),
('nina_park', '{{HASH_CUSTOMER}}', 'Nina Park', 'nina@example.com', 'Customer', TRUE),
('tom_lee', '{{HASH_CUSTOMER}}', 'Tom Lee', 'tom@example.com', 'Customer', TRUE),
('pam_su', '{{HASH_CUSTOMER}}', 'Pam Su', 'pam@example.com', 'Customer', TRUE),
('kai_cho', '{{HASH_CUSTOMER}}', 'Kai Cho', 'kai@example.com', 'Customer', TRUE),
('mint_jira', '{{HASH_CUSTOMER}}', 'Mint Jira', 'mint@example.com', 'Customer', TRUE),
('beam_narin', '{{HASH_CUSTOMER}}', 'Beam Narin', 'beam@example.com', 'Customer', TRUE),
('fah_korn', '{{HASH_CUSTOMER}}', 'Fah Korn', 'fah@example.com', 'Customer', TRUE),
('pond_rit', '{{HASH_CUSTOMER}}', 'Pond Rit', 'pond@example.com', 'Customer', TRUE),
('ploy_tan', '{{HASH_CUSTOMER}}', 'Ploy Tan', 'ploy@example.com', 'Customer', TRUE),
('gun_atcha', '{{HASH_CUSTOMER}}', 'Gun Atcha', 'gun@example.com', 'Customer', TRUE),
('nammon_p', '{{HASH_CUSTOMER}}', 'Nammon P', 'nammon@example.com', 'Customer', TRUE),
('ice_tawan', '{{HASH_CUSTOMER}}', 'Ice Tawan', 'ice@example.com', 'Customer', TRUE),
('fern_k', '{{HASH_CUSTOMER}}', 'Fern K', 'fern@example.com', 'Customer', TRUE),
('oak_w', '{{HASH_CUSTOMER}}', 'Oak W', 'oak@example.com', 'Customer', TRUE),
('prim_m', '{{HASH_CUSTOMER}}', 'Prim M', 'prim@example.com', 'Customer', TRUE);

-- Venues (4 halls)
INSERT INTO venues (venues_name, venues_address) VALUES
('CineMax Hall A', '1 Cinema Boulevard, Bangkok'),
('StarPlex Hall B', '45 Entertainment Avenue, Bangkok'),
('MegaScreen Hall C', '200 Movie Street, Bangkok'),
('Galaxy Hall D', '88 Riverside Road, Bangkok');

-- Seats (40 per venue = 160 total): A1-A10, B1-B10, C1-C10, D1-D10
INSERT INTO seats (seat_number)
WITH RECURSIVE venue_seq AS (
  SELECT 1 AS v
  UNION ALL
  SELECT v + 1 FROM venue_seq WHERE v < 4
),
seat_seq AS (
  SELECT 1 AS s
  UNION ALL
  SELECT s + 1 FROM seat_seq WHERE s < 40
)
SELECT CONCAT(CHAR(64 + CEIL(s / 10)), ((s - 1) % 10) + 1) AS seat_number
FROM venue_seq
CROSS JOIN seat_seq
ORDER BY venue_seq.v, seat_seq.s;

-- Seat-to-venue mapping
INSERT INTO contain_seats (venues_id, seat_id)
WITH RECURSIVE venue_seq AS (
  SELECT 1 AS venues_id
  UNION ALL
  SELECT venues_id + 1 FROM venue_seq WHERE venues_id < 4
),
seat_offset AS (
  SELECT 1 AS seat_no
  UNION ALL
  SELECT seat_no + 1 FROM seat_offset WHERE seat_no < 40
)
SELECT venues_id, ((venues_id - 1) * 40) + seat_no AS seat_id
FROM venue_seq
CROSS JOIN seat_offset
ORDER BY venues_id, seat_no;

-- Movies / showtimes (12)
INSERT INTO showtimes (showtime_title, showtime_descript, duration, status, genre, poster_url, release_date, end_date) VALUES
('Avengers: Endgame', 'The Avengers make one final stand against Thanos.', 181, 'Open', 'Action', NULL, '2019-04-26', NULL),
('The Dark Knight', 'Batman faces the Joker as Gotham spirals into chaos.', 152, 'Open', 'Action', NULL, '2008-07-18', NULL),
('Inception', 'A thief enters dreams to plant an idea in a mark''s mind.', 148, 'Open', 'Sci-Fi', NULL, '2010-07-16', NULL),
('Interstellar', 'Astronauts travel through a wormhole seeking a new home.', 169, 'Ended', 'Sci-Fi', NULL, '2014-11-07', '2026-02-28'),
('Parasite', 'A poor family schemes their way into a wealthy household.', 132, 'Hidden', 'Thriller', NULL, '2019-05-30', NULL),
('Oppenheimer', 'The story of J. Robert Oppenheimer and the atomic bomb.', 180, 'Open', 'Drama', NULL, '2023-07-21', NULL),
('Dune: Part Two', 'Paul Atreides unites with the Fremen for revenge.', 166, 'Open', 'Sci-Fi', NULL, '2024-03-01', NULL),
('Inside Out 2', 'Riley enters teen life with new emotions joining headquarters.', 96, 'Open', 'Animation', NULL, '2024-06-14', NULL),
('Mission: Impossible - Dead Reckoning', 'Ethan Hunt tracks a dangerous AI weapon.', 163, 'Ended', 'Action', NULL, '2023-07-12', '2026-01-31'),
('Past Lives', 'Two childhood friends reconnect decades later.', 106, 'Hidden', 'Romance', NULL, '2023-06-02', NULL),
('How to Train Your Dragon (Reissue)', 'A young Viking befriends a dragon.', 98, 'Upcoming', 'Adventure', NULL, '2026-07-10', NULL),
('The Creator 2 (Teaser Run)', 'A near-future conflict between humans and AI.', 140, 'Upcoming', 'Sci-Fi', NULL, '2026-08-01', NULL);

-- Showings base set: 48 rows
-- - 36 past rows (9 months x 4 venues)
-- - 12 near-future rows (3 months x 4 venues)
INSERT INTO showing (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language)
WITH RECURSIVE m AS (
  SELECT 0 AS month_offset
  UNION ALL
  SELECT month_offset + 1 FROM m WHERE month_offset < 8
),
v AS (
  SELECT 1 AS venues_id
  UNION ALL
  SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
)
SELECT
  ((m.month_offset + v.venues_id - 1) % 10) + 1 AS show_id,
  v.venues_id,
  CASE
    WHEN m.month_offset >= 6 THEN 'Overdue'
    WHEN m.month_offset = 5 AND v.venues_id = 2 THEN 'Full'
    ELSE 'Ontime'
  END AS status,
  DATE_SUB(CURDATE(), INTERVAL ((8 - m.month_offset) * 30 + v.venues_id) DAY) AS showtime_date,
  CASE v.venues_id
    WHEN 1 THEN '10:00:00'
    WHEN 2 THEN '12:30:00'
    WHEN 3 THEN '15:00:00'
    ELSE '18:30:00'
  END AS start_time,
  CASE v.venues_id
    WHEN 1 THEN '12:40:00'
    WHEN 2 THEN '15:10:00'
    WHEN 3 THEN '17:45:00'
    ELSE '21:10:00'
  END AS end_time,
  DATE_SUB(CURDATE(), INTERVAL ((8 - m.month_offset) * 30 + 20 + v.venues_id) DAY) AS booking_date,
  CASE WHEN (v.venues_id + m.month_offset) % 2 = 0 THEN 'EN' ELSE 'TH' END AS language
FROM m
CROSS JOIN v
ORDER BY showtime_date, venues_id;

INSERT INTO showing (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language)
WITH RECURSIVE fm AS (
  SELECT 0 AS month_offset
  UNION ALL
  SELECT month_offset + 1 FROM fm WHERE month_offset < 2
),
v AS (
  SELECT 1 AS venues_id
  UNION ALL
  SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
)
SELECT
  ((fm.month_offset * 3 + v.venues_id + 4) % 12) + 1 AS show_id,
  v.venues_id,
  CASE WHEN fm.month_offset = 2 AND v.venues_id IN (1, 4) THEN 'Overdue' ELSE 'Ontime' END AS status,
  DATE_ADD(CURDATE(), INTERVAL (7 + fm.month_offset * 28 + v.venues_id) DAY) AS showtime_date,
  CASE v.venues_id
    WHEN 1 THEN '11:00:00'
    WHEN 2 THEN '13:45:00'
    WHEN 3 THEN '16:15:00'
    ELSE '19:00:00'
  END AS start_time,
  CASE v.venues_id
    WHEN 1 THEN '13:20:00'
    WHEN 2 THEN '16:05:00'
    WHEN 3 THEN '18:30:00'
    ELSE '21:30:00'
  END AS end_time,
  DATE_SUB(DATE_ADD(CURDATE(), INTERVAL (7 + fm.month_offset * 28 + v.venues_id) DAY), INTERVAL 14 DAY) AS booking_date,
  CASE WHEN (v.venues_id + fm.month_offset) % 2 = 0 THEN 'EN' ELSE 'TH' END AS language
FROM fm
CROSS JOIN v
ORDER BY showtime_date, venues_id;

-- Dense window for Screen Manager: 120 extra rows (15 days x 4 venues x 2 slots)
INSERT INTO showing (show_id, venues_id, status, showtime_date, start_time, end_time, booking_date, language)
WITH RECURSIVE d AS (
  SELECT -7 AS day_offset
  UNION ALL
  SELECT day_offset + 1 FROM d WHERE day_offset < 7
),
v AS (
  SELECT 1 AS venues_id
  UNION ALL
  SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
),
slot AS (
  SELECT 1 AS slot_id, '11:00:00' AS start_time, '13:20:00' AS end_time
  UNION ALL
  SELECT 2 AS slot_id, '18:00:00' AS start_time, '20:30:00' AS end_time
)
SELECT
  ((d.day_offset + 10 + v.venues_id + slot.slot_id) % 12) + 1 AS show_id,
  v.venues_id,
  CASE
    WHEN d.day_offset < -1 THEN 'Overdue'
    WHEN d.day_offset = 0 AND v.venues_id = 2 AND slot.slot_id = 2 THEN 'Full'
    ELSE 'Ontime'
  END AS status,
  DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY) AS showtime_date,
  slot.start_time,
  slot.end_time,
  DATE_SUB(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), INTERVAL 12 DAY) AS booking_date,
  CASE WHEN (v.venues_id + d.day_offset + slot.slot_id) % 2 = 0 THEN 'EN' ELSE 'TH' END AS language
FROM d
CROSS JOIN v
CROSS JOIN slot
ORDER BY showtime_date, venues_id, start_time;

-- Reserved seats baseline (168 showings x 40 seats = 6,720)
INSERT INTO reserved_seats (showing_id, seat_id, status, seat_price)
SELECT
  sh.showing_id,
  cs.seat_id,
  'Free' AS status,
  CASE
    WHEN HOUR(sh.start_time) >= 18 THEN 320.00
    WHEN DAYOFWEEK(sh.showtime_date) IN (1, 7) THEN 300.00
    ELSE 260.00
  END AS seat_price
FROM showing sh
JOIN contain_seats cs ON cs.venues_id = sh.venues_id
ORDER BY sh.showing_id, cs.seat_id;

-- Stable sequence map for deterministic booking seeding
CREATE TEMPORARY TABLE seed_showing_map AS
SELECT
  showing_id,
  ROW_NUMBER() OVER (ORDER BY showtime_date, venues_id, start_time, showing_id) AS seq
FROM showing;

-- Bookings (66 rows across all statuses, denser around past/current/next month)
INSERT INTO booking (user_id, showing_id, date, time, status, payment_proof_url)
WITH booking_seed AS (
  SELECT 1 AS seq, 3 AS user_id, 250 AS days_ago, '09:15:00' AS booking_time, 'Successful' AS status, 'https://storage.example.com/proof/b1.jpg' AS proof_url
  UNION ALL SELECT 1, 4, 249, '09:20:00', 'Successful', NULL
  UNION ALL SELECT 2, 5, 246, '11:05:00', 'Successful', 'https://storage.example.com/proof/b3.jpg'
  UNION ALL SELECT 3, 6, 242, '14:30:00', 'Successful', NULL
  UNION ALL SELECT 4, 7, 240, '17:55:00', 'Successful', NULL
  UNION ALL SELECT 5, 8, 220, '09:05:00', 'Successful', 'https://storage.example.com/proof/b6.jpg'
  UNION ALL SELECT 6, 3, 215, '12:10:00', 'Successful', NULL
  UNION ALL SELECT 7, 4, 210, '15:20:00', 'Cancel', NULL
  UNION ALL SELECT 8, 5, 205, '19:15:00', 'Successful', NULL
  UNION ALL SELECT 9, 6, 190, '10:00:00', 'Successful', 'https://storage.example.com/proof/b10.jpg'
  UNION ALL SELECT 10, 7, 186, '12:45:00', 'Checkout', NULL
  UNION ALL SELECT 11, 8, 182, '15:35:00', 'Booking', NULL
  UNION ALL SELECT 12, 3, 179, '18:10:00', 'Successful', NULL
  UNION ALL SELECT 13, 4, 165, '09:40:00', 'Successful', NULL
  UNION ALL SELECT 14, 5, 160, '13:10:00', 'Successful', 'https://storage.example.com/proof/b15.jpg'
  UNION ALL SELECT 15, 6, 154, '15:00:00', 'Cancel', NULL
  UNION ALL SELECT 16, 7, 150, '19:05:00', 'Successful', NULL
  UNION ALL SELECT 17, 8, 138, '10:25:00', 'Successful', NULL
  UNION ALL SELECT 18, 3, 132, '12:35:00', 'Checkout', NULL
  UNION ALL SELECT 19, 4, 126, '15:40:00', 'Successful', NULL
  UNION ALL SELECT 20, 5, 121, '19:30:00', 'Successful', 'https://storage.example.com/proof/b21.jpg'
  UNION ALL SELECT 21, 6, 110, '09:10:00', 'Booking', NULL
  UNION ALL SELECT 22, 7, 104, '12:00:00', 'Successful', NULL
  UNION ALL SELECT 23, 8, 99, '14:50:00', 'Successful', NULL
  UNION ALL SELECT 24, 3, 92, '18:40:00', 'Successful', NULL
  UNION ALL SELECT 25, 4, 78, '10:10:00', 'Successful', 'https://storage.example.com/proof/b26.jpg'
  UNION ALL SELECT 26, 5, 72, '13:00:00', 'Checkout', NULL
  UNION ALL SELECT 27, 6, 68, '15:30:00', 'Cancel', NULL
  UNION ALL SELECT 28, 7, 62, '19:20:00', 'Successful', NULL
  UNION ALL SELECT 29, 8, 47, '09:30:00', 'Successful', NULL
  UNION ALL SELECT 30, 3, 43, '12:20:00', 'Booking', NULL
  UNION ALL SELECT 31, 4, 38, '15:15:00', 'Successful', NULL
  UNION ALL SELECT 32, 5, 32, '19:00:00', 'Successful', NULL
  UNION ALL SELECT 45, 6, 5, '10:45:00', 'Booking', NULL
  UNION ALL SELECT 46, 7, 3, '14:05:00', 'Checkout', NULL
  UNION ALL SELECT 47, 8, 1, '16:20:00', 'Successful', 'https://storage.example.com/proof/b36.jpg'
  UNION ALL SELECT 120, 9, 35, '10:00:00', 'Successful', NULL
  UNION ALL SELECT 121, 10, 33, '12:10:00', 'Successful', NULL
  UNION ALL SELECT 122, 11, 31, '14:15:00', 'Successful', 'https://storage.example.com/proof/b39.jpg'
  UNION ALL SELECT 123, 12, 29, '18:30:00', 'Successful', NULL
  UNION ALL SELECT 124, 13, 27, '11:05:00', 'Checkout', NULL
  UNION ALL SELECT 125, 14, 25, '15:45:00', 'Booking', NULL
  UNION ALL SELECT 126, 15, 23, '19:20:00', 'Successful', NULL
  UNION ALL SELECT 127, 16, 21, '09:40:00', 'Successful', NULL
  UNION ALL SELECT 128, 17, 20, '12:35:00', 'Successful', NULL
  UNION ALL SELECT 129, 18, 18, '16:10:00', 'Cancel', NULL
  UNION ALL SELECT 130, 19, 17, '18:50:00', 'Booking', NULL
  UNION ALL SELECT 131, 20, 16, '10:15:00', 'Successful', NULL
  UNION ALL SELECT 132, 21, 15, '13:25:00', 'Checkout', NULL
  UNION ALL SELECT 133, 22, 14, '16:45:00', 'Successful', 'https://storage.example.com/proof/b49.jpg'
  UNION ALL SELECT 134, 3, 13, '19:15:00', 'Successful', NULL
  UNION ALL SELECT 135, 4, 12, '10:30:00', 'Booking', NULL
  UNION ALL SELECT 136, 5, 11, '13:40:00', 'Successful', NULL
  UNION ALL SELECT 137, 6, 10, '17:00:00', 'Successful', NULL
  UNION ALL SELECT 138, 7, 9, '20:05:00', 'Checkout', NULL
  UNION ALL SELECT 139, 8, 8, '09:20:00', 'Successful', NULL
  UNION ALL SELECT 140, 9, 7, '12:55:00', 'Successful', NULL
  UNION ALL SELECT 141, 10, 6, '15:10:00', 'Booking', NULL
  UNION ALL SELECT 142, 11, 5, '18:25:00', 'Successful', NULL
  UNION ALL SELECT 143, 12, 4, '10:50:00', 'Successful', NULL
  UNION ALL SELECT 144, 13, 3, '14:05:00', 'Checkout', NULL
  UNION ALL SELECT 145, 14, 2, '16:20:00', 'Successful', 'https://storage.example.com/proof/b61.jpg'
  UNION ALL SELECT 146, 15, 1, '19:40:00', 'Booking', NULL
  UNION ALL SELECT 147, 16, 0, '11:15:00', 'Successful', NULL
  UNION ALL SELECT 148, 17, -2, '13:35:00', 'Booking', NULL
  UNION ALL SELECT 149, 18, -4, '17:20:00', 'Checkout', NULL
  UNION ALL SELECT 150, 19, -8, '10:40:00', 'Booking', NULL
  UNION ALL SELECT 151, 20, -12, '12:30:00', 'Checkout', NULL
  UNION ALL SELECT 152, 21, -16, '15:50:00', 'Booking', NULL
  UNION ALL SELECT 153, 22, -20, '18:10:00', 'Booking', NULL
  UNION ALL SELECT 154, 9, -24, '11:20:00', 'Checkout', NULL
  UNION ALL SELECT 155, 10, -28, '14:00:00', 'Booking', NULL
  UNION ALL SELECT 156, 11, -32, '16:40:00', 'Successful', 'https://storage.example.com/proof/b73.jpg'
  UNION ALL SELECT 157, 12, -35, '19:10:00', 'Booking', NULL
)
SELECT
  bs.user_id,
  sm.showing_id,
  DATE_SUB(CURDATE(), INTERVAL bs.days_ago DAY) AS date,
  bs.booking_time AS time,
  bs.status,
  bs.proof_url
FROM booking_seed bs
JOIN seed_showing_map sm ON sm.seq = bs.seq;

-- Wave traffic for showcase: past month -> current month -> next month
-- This creates a sinusoidal booking density pattern.
INSERT INTO booking (user_id, showing_id, date, time, status, payment_proof_url)
WITH RECURSIVE day_steps AS (
  SELECT -45 AS day_offset
  UNION ALL
  SELECT day_offset + 3 FROM day_steps WHERE day_offset < 45
),
wave_points AS (
  SELECT
    day_offset,
    ROW_NUMBER() OVER (ORDER BY day_offset) AS point_no,
    (SIN((((day_offset + 45) / 90) * 2) * PI()) + 1) / 2 AS wave_strength
  FROM day_steps
),
expanded_wave AS (
  SELECT day_offset, point_no, 1 AS slot_no FROM wave_points WHERE wave_strength > 0.20
  UNION ALL
  SELECT day_offset, point_no, 2 AS slot_no FROM wave_points WHERE wave_strength > 0.55
  UNION ALL
  SELECT day_offset, point_no, 3 AS slot_no FROM wave_points WHERE wave_strength > 0.82
)
SELECT
  3 + MOD(point_no + slot_no, 20) AS user_id, -- customer user_id range 3..22
  sm.showing_id,
  DATE_ADD(CURDATE(), INTERVAL day_offset DAY) AS date,
  CASE slot_no
    WHEN 1 THEN '10:20:00'
    WHEN 2 THEN '14:10:00'
    ELSE '19:05:00'
  END AS time,
  CASE
    WHEN slot_no = 3 AND MOD(point_no, 5) = 0 THEN 'Checkout'
    WHEN slot_no = 2 AND MOD(point_no, 7) = 0 THEN 'Booking'
    ELSE 'Successful'
  END AS status,
  CASE
    WHEN MOD(point_no + slot_no, 4) = 0
      THEN CONCAT('https://storage.example.com/proof/wave_', point_no, '_', slot_no, '.jpg')
    ELSE NULL
  END AS payment_proof_url
FROM expanded_wave ew
JOIN seed_showing_map sm ON sm.seq = 40 + MOD((ew.point_no * 3) + (ew.slot_no * 5), 110);

-- Booking items: 3 seats per booking, deterministic per venue block
INSERT INTO booking_items (booking_id, seat_id)
SELECT
  b.booking_id,
  ((sh.venues_id - 1) * 40)
  + (((b.booking_id - 1) * 3 + n.seq - 1) % 40)
  + 1 AS seat_id
FROM booking b
JOIN showing sh ON sh.showing_id = b.showing_id
JOIN (
  SELECT 1 AS seq
  UNION ALL SELECT 2
  UNION ALL SELECT 3
) n;

-- Apply booking status to reserved seats
UPDATE reserved_seats rs
JOIN booking b ON b.showing_id = rs.showing_id
JOIN booking_items bi ON bi.booking_id = b.booking_id AND bi.seat_id = rs.seat_id
SET rs.status = CASE
  WHEN b.status = 'Successful' THEN 'Confirmed'
  WHEN b.status IN ('Booking', 'Checkout') THEN 'Reserved'
  ELSE rs.status
END
WHERE b.status <> 'Cancel';

-- Make Full showings visually obvious
UPDATE reserved_seats rs
JOIN showing sh ON sh.showing_id = rs.showing_id
SET rs.status = 'Confirmed'
WHERE sh.status = 'Full';

DROP TEMPORARY TABLE IF EXISTS seed_showing_map;
