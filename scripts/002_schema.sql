-- 002_schema.sql
-- Run AFTER 001_create_database: creates all tables inside CPE241_final_project.
-- Safe to re-run: drops in reverse FK order before creating.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS booking_items;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS reserved_seats;
DROP TABLE IF EXISTS showing;
DROP TABLE IF EXISTS contain_seats;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS users_profile;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Independent tables ────────────────────────────────────────────────────────

CREATE TABLE users_profile (
  user_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(100) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  role         ENUM('Customer','Admin') NOT NULL DEFAULT 'Customer',
  PDPA_status  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venues (
  venues_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venues_name    VARCHAR(100) NOT NULL,
  venues_address VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seats (
  seat_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seat_number VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE showtimes (
  show_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  showtime_title    VARCHAR(200) NOT NULL,
  showtime_descript TEXT,
  duration          INT NOT NULL,
  status            ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  genre             VARCHAR(100),
  poster_url        VARCHAR(500),
  release_date      DATE,
  CONSTRAINT chk_duration CHECK (duration > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tables with one FK level ──────────────────────────────────────────────────

CREATE TABLE contain_seats (
  venues_id INT UNSIGNED NOT NULL,
  seat_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (venues_id, seat_id),
  CONSTRAINT fk_cs_venue FOREIGN KEY (venues_id) REFERENCES venues(venues_id) ON DELETE RESTRICT,
  CONSTRAINT fk_cs_seat  FOREIGN KEY (seat_id)   REFERENCES seats(seat_id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE showing (
  showing_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  show_id       INT UNSIGNED NOT NULL,
  venues_id     INT UNSIGNED NOT NULL,
  status        ENUM('Ontime','Overdue','Full') NOT NULL DEFAULT 'Ontime',
  showtime_date DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  booking_date  DATE,
  language      VARCHAR(50),
  UNIQUE KEY uq_venue_date_slot (venues_id, showtime_date, start_time),
  CONSTRAINT fk_showing_movie FOREIGN KEY (show_id)   REFERENCES showtimes(show_id)   ON DELETE RESTRICT,
  CONSTRAINT fk_showing_venue FOREIGN KEY (venues_id) REFERENCES venues(venues_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tables with two FK levels ─────────────────────────────────────────────────

CREATE TABLE reserved_seats (
  showing_id INT UNSIGNED    NOT NULL,
  seat_id    INT UNSIGNED    NOT NULL,
  status     ENUM('Free','Reserved','Confirmed') NOT NULL DEFAULT 'Free',
  seat_price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (showing_id, seat_id),
  CONSTRAINT chk_seat_price CHECK (seat_price > 0),
  CONSTRAINT fk_rs_showing FOREIGN KEY (showing_id) REFERENCES showing(showing_id) ON DELETE RESTRICT,
  CONSTRAINT fk_rs_seat    FOREIGN KEY (seat_id)    REFERENCES seats(seat_id)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE booking (
  booking_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  showing_id       INT UNSIGNED NOT NULL,
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  status           ENUM('Booking','Checkout','Successful','Cancel') NOT NULL DEFAULT 'Booking',
  payment_proof_url VARCHAR(500),
  CONSTRAINT fk_booking_user    FOREIGN KEY (user_id)    REFERENCES users_profile(user_id)   ON DELETE RESTRICT,
  CONSTRAINT fk_booking_showing FOREIGN KEY (showing_id) REFERENCES showing(showing_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Leaf tables ───────────────────────────────────────────────────────────────

CREATE TABLE booking_items (
  booking_id INT UNSIGNED NOT NULL,
  seat_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (booking_id, seat_id),
  CONSTRAINT fk_bi_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bi_seat    FOREIGN KEY (seat_id)    REFERENCES seats(seat_id)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
