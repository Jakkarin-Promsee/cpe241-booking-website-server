# 🎬 Ticket Booking System — Database Documentation

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [showtimes vs showing — Key Distinction](#showtimes-vs-showing--key-distinction)
3. [Admin Functions](#admin-functions)
4. [User Functions](#user-functions)
5. [Database Schema](#database-schema)
6. [Entity Relationships](#entity-relationships)
7. [Workflow & SQL](#workflow--sql)
8. [Constraints & Business Rules](#constraints--business-rules)
9. [Status Definitions](#status-definitions)
10. [Future Improvements](#future-improvements)

---

## System Overview

The **Ticket Booking System** is a centralized database designed to manage movie screening schedules, venue seating, and user transactions.

### Core Goals

- **Prevent Double-Booking** — No seat may be booked more than once per screening slot.
- **Real-time Availability** — Both admins and users must always see accurate, up-to-date seat status.
- **Data Integrity** — Every transaction must either fully succeed or fully roll back (Atomicity).

---

## showtimes vs showing — Key Distinction

> ⚠️ **Important** — These two tables serve entirely different purposes.

|                      | `showtimes`                          | `showing`                                       |
| -------------------- | ------------------------------------ | ----------------------------------------------- |
| **What it is**       | Movie catalog (Master Data)          | An actual screening slot                        |
| **Stores**           | Title, description, duration, status | Venue + Movie + Date + Time                     |
| **Analogy**          | "Avengers exists in the system"      | "Avengers screens in Hall 3 on May 12 at 14:00" |
| **Foreign keys out** | None (it is the master)              | → `venues_id`, → `show_id`                      |

One movie (`showtimes`) can have many `showing` records across different halls, dates, and time slots.

---

## Admin Functions

### 1. Dashboard

The first page an admin sees upon login. Displays system data in real-time.

| Component                | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Status Cards**         | Daily booking totals and revenue summary, plus the number of currently screening movies |
| **Weekly Booking Trend** | A chart showing booking volume trends over the past week                                |
| **Upcoming Showtimes**   | Verify hall readiness and staff availability before screenings begin                    |
| **Quick Alerts**         | Urgent notifications such as hall issues or fully booked slots                          |

---

### 2. Movie Management

Manage the **movie catalog** (`showtimes` table).

#### Capabilities

- **Create** — Add a new movie (title, description, duration, rating).
- **Update** — Edit movie details or set status to `Inactive` to remove it from the program.
- **Delete** — Remove movies that were entered incorrectly or are no longer needed.

#### Screens

- **List View** — Search and review the status of all movies; select a record to Edit or Delete.
- **Add / Edit Movie Detail** — Form for recording a movie's core information into the database.

---

### 3. Screen Management

Plan `showing` records (actual screening slots) for each hall.

#### Capabilities

- Assign which movie screens in which hall, on which date and time.
- Enable or disable individual seats (e.g., for a broken chair).
- Verify that no two screenings in the same hall overlap (requires `end_time`).

#### Screens

| Screen                       | Purpose                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Selection & Filters**      | Choose a branch and date to plan the schedule                                  |
| **Showtime Timeline / Grid** | Inspect schedule density and gaps to prevent slot overlaps                     |
| **Showtime List & Actions**  | Table of start/end times, seats sold, status — with Edit / Delete buttons      |
| **Add New Showtime**         | Define screening conditions (time / language / price) for a movie-hall pairing |

---

### 4. Booking Management

Review and manage customer booking transactions.

#### Capabilities

- Search booking history by customer name or booking ID.
- Cancel a booking and process a refund.
- Manually update payment status for walk-in (counter) payments.

#### Screens

- **Filters & Search** — Track customer bookings to resolve issues or confirm attendance.
- **Booking Table** — Verify payment amounts and seat details for each booking record.

---

### 5. Reports & Analytics

Analyze historical data to support business planning.

#### Capabilities

- Pull monthly sales reports broken down by branch or movie genre.
- View Peak Hours statistics (time slots with the highest booking volume).
- Export data as Excel or PDF for the accounting team.

#### Screens

| Component                   | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| **Global Filters**          | Adjust the time range to compare data across different seasons    |
| **Status Cards**            | Summarize sales and costs for KPI measurement                     |
| **Visual Data**             | Charts showing overall revenue and viewing behavior by movie type |
| **Generate Custom Reports** | Produce focused reports for meetings or marketing planning        |

---

### Admin CRUD Flow

```
1. Select the table to manage.
2. The system displays a data table with: [Create] [Edit] [Delete] [Search] buttons.
3. Clicking Edit or Delete always triggers a Confirmation Pop-up first.
```

> ⚠️ **Rule:** Every Edit and Delete action must show a Confirmation Pop-up before proceeding.

---

## User Functions

### Login / Register

```
1. User navigates to the Login page.
2. Enter Username / Password.
3. Server receives the hashed password → validates → returns user_id.
4. user_id is used to communicate with all other parts of the system.
```

---

### Browse Available Showings & Seats

```
1. Query showings where status = 'Ontime' and showtime_date >= today.
2. Sort by showtime_date, start_time → return list of showing_id to client.
3. User selects a showing → fetch details using showing_id.
4. Filter reserved_seats by showing_id where status = 'Free'.
5. Return list of available seat_ids to client.
```

> ⚠️ **Note:** Filtering must use `showing_id`, not `show_id` (movie id).
> Seat availability is per **screening slot**, not per **movie title**.

---

### Booking Flow

```
1. After login → navigate to a Showing detail page.
2. Select desired seats → system calculates total price from reserved_seats.seat_price.
3. Client sends: user_id + showing_id + list of seat_ids
   → stored in booking table as a new transaction (status = 'Booking').
4. At this stage the user can still add, remove, or change selected seats.
5. User clicks "Confirm Checkout" → proceed to Payment.
```

---

### Checkout Flow

```
1. User clicks Confirm Checkout.
2. System runs UPDATE reserved_seats: Free → Reserved
   using SELECT FOR UPDATE (row-level lock) to prevent race conditions.
   ├── If all seats are still Free → lock succeeds → continue.
   └── If any seat is already Reserved/Confirmed → notify user immediately.
3. booking.status → 'Checkout'
4. 5-minute countdown timer starts.
   ├── Payment completed within 5 minutes:
   │   ├── reserved_seats.status → 'Confirmed'
   │   └── booking.status → 'Successful'
   └── Timer expires (via Trigger / Scheduler):
       ├── reserved_seats.status → 'Free' (released back to the system)
       ├── booking.status → 'Cancel'
       └── Penalty: User is banned for 30 minutes.
```

---

## Database Schema

### Core Tables

---

#### `showtimes` — Movie Catalog (Master Data)

| Column              | Type          | Description                |
| ------------------- | ------------- | -------------------------- |
| `show_id`           | PK            | Movie ID                   |
| `showtime_title`    | VARCHAR       | Movie title                |
| `showtime_descript` | TEXT          | Plot summary / description |
| `duration`          | INT CHECK > 0 | Movie length in minutes    |
| `status`            | ENUM          | `Active` / `Inactive`      |

> `duration` lives here because it is a property of the **movie**, not the screening slot.
> `showing` references duration from here to calculate `end_time`.
>
> `status` supports Movie Management — an `Inactive` movie cannot have new `showing` records created.

---

#### `venues` — Theater / Branch

| Column           | Type    | Description        |
| ---------------- | ------- | ------------------ |
| `venues_id`      | PK      | Venue ID           |
| `venues_name`    | VARCHAR | Hall / branch name |
| `venues_address` | VARCHAR | Physical address   |

---

#### `seats` — Physical Seats

| Column        | Type    | Description               |
| ------------- | ------- | ------------------------- |
| `seat_id`     | PK      | Seat ID                   |
| `seat_number` | VARCHAR | Seat label (e.g., A1, B5) |

> `seats` stores only physical identity.
> Which venue a seat belongs to is stored in `contain_seats`.
> Per-screening status and price are stored in `reserved_seats`.

---

#### `users_profile` — User Accounts

| Column         | Type           | Description                           |
| -------------- | -------------- | ------------------------------------- |
| `user_id`      | PK             | User ID                               |
| `username`     | VARCHAR UNIQUE | Login username                        |
| `password`     | VARCHAR        | Hashed password                       |
| `display_name` | VARCHAR        | Name shown in the UI                  |
| `first_name`   | VARCHAR        | First name                            |
| `last_name`    | VARCHAR        | Last name                             |
| `phone_number` | VARCHAR        | Phone number                          |
| `email`        | VARCHAR UNIQUE | Email address (must be unique)        |
| `PDPA_status`  | BOOLEAN        | Must be `TRUE` before a user can book |
| `role`         | ENUM           | `Customer` / `Admin`                  |

---

#### `booking` — Booking Transactions

| Column       | Type               | Description                     |
| ------------ | ------------------ | ------------------------------- |
| `booking_id` | PK                 | Booking ID                      |
| `users_id`   | FK → users_profile | The user who made the booking   |
| `showing_id` | FK → **showing**   | The screening slot being booked |
| `date`       | DATE               | Date the booking was created    |
| `time`       | TIME               | Time the booking was created    |
| `status`     | ENUM               | Current booking status          |

> ⚠️ **FK must point to `showing_id`**, not `show_id`.
> A user books a specific screening (hall + date + time), not just a movie title.

---

#### `booking_items` — Seats Within a Booking

| Column       | Type         | Description       |
| ------------ | ------------ | ----------------- |
| `booking_id` | FK → booking | Booking reference |
| `seat_id`    | FK → seats   | The booked seat   |

> PK = `(booking_id, seat_id)`
> One booking can contain multiple seats (Many-to-Many via booking_items).

---

### Relation Tables

---

#### `contain_seats` — venues ↔ seats

| Column      | Type        | Description                      |
| ----------- | ----------- | -------------------------------- |
| `venues_id` | FK → venues | The venue                        |
| `seat_id`   | FK → seats  | A seat that exists in that venue |

> PK = `(venues_id, seat_id)`

---

#### `showing` — Actual Screening Slot

| Column          | Type           | Description                                            |
| --------------- | -------------- | ------------------------------------------------------ |
| `showing_id`    | PK             | Screening slot ID                                      |
| `venues_id`     | FK → venues    | The hall where it screens                              |
| `show_id`       | FK → showtimes | The movie being screened                               |
| `status`        | ENUM           | `Ontime` / `Overdue` / `Full`                          |
| `showtime_date` | DATE           | The date of the screening                              |
| `start_time`    | TIME           | Screening start time                                   |
| `end_time`      | TIME           | Screening end time = `start_time + showtimes.duration` |
| `booking_date`  | DATE           | The date bookings open                                 |
| `language`      | VARCHAR        | Audio / subtitle language (TH / EN / SUB)              |

> `end_time` is required for overlap detection in Screen Management.
> It can be calculated as `start_time + duration` and stored as a computed column,
> or computed at the application layer before inserting.
>
> **Overlap Rule:** Two showings in the same venue conflict if:
> `new.start_time < existing.end_time AND new.end_time > existing.start_time`

---

#### `reserved_seats` — Seat Status Per Screening Slot

| Column       | Type              | Description                       |
| ------------ | ----------------- | --------------------------------- |
| `showing_id` | FK → **showing**  | The screening slot                |
| `seat_id`    | FK → seats        | The seat                          |
| `status`     | ENUM              | `Free` / `Reserved` / `Confirmed` |
| `seat_price` | DECIMAL CHECK > 0 | Price of this seat for this slot  |

> PK = `(showing_id, seat_id)`
>
> ⚠️ **FK must point to `showing_id`**, not `show_id`.
> Seat A1 in Hall 3 at 14:00 and Seat A1 in Hall 3 at 17:00 must have independent status records.
> Using `show_id` (movie) would cause both slots to share the same row — immediately broken.
>
> ⚠️ **Auto-populate on showing creation:**
> When an admin creates a new `showing`, the system must INSERT a `reserved_seats` row for every
> seat in that venue (sourced from `contain_seats`), with `status = 'Free'` and the configured `seat_price`.
> This can be implemented via a Database Trigger or Application Logic.

---

## Entity Relationships

```
showtimes ─────────────── showing ─────────────── venues
(movie catalog)        (screening slot)          (theater)
      │                      │                      │
      │              reserved_seats           contain_seats
      │              (seat per slot)          (seat layout)
      │                      │                      │
      └──────────────────── seats ──────────────────┘
                              │
                         booking_items
                              │
                           booking ──── users_profile
                        (transaction)      (user)
```

### Step-by-Step Workflow

1. Admin adds a movie to `showtimes` (catalog).
2. Admin creates a `showing` — linking `showtimes` + `venues` + date + time.
3. System auto-populates `reserved_seats` for every seat in that venue (from `contain_seats`) with `status = 'Free'`.
4. User browses `showing` records → checks `reserved_seats` for available seats.
5. User creates a `booking` (FK → `showing_id`) and `booking_items` (the list of seats).
6. User confirms checkout → `reserved_seats.status = 'Reserved'` → payment → `'Confirmed'`.

---

## Workflow & SQL

### 1. Availability Check

```sql
-- Fetch screenings that are open for booking
SELECT
  sg.showing_id,
  st.showtime_title,
  v.venues_name,
  sg.showtime_date,
  sg.start_time,
  sg.end_time,
  sg.language
FROM showing sg
JOIN showtimes st ON sg.show_id    = st.show_id
JOIN venues    v  ON sg.venues_id  = v.venues_id
WHERE sg.status        = 'Ontime'
  AND sg.showtime_date >= CURDATE()
  AND sg.booking_date  <= CURDATE()
  AND st.status        = 'Active'
ORDER BY sg.showtime_date, sg.start_time;
```

```sql
-- Fetch available seats for a selected showing
SELECT rs.seat_id, s.seat_number, rs.seat_price
FROM reserved_seats rs
JOIN seats s ON rs.seat_id = s.seat_id
WHERE rs.showing_id = :showing_id   -- showing_id, NOT show_id
  AND rs.status = 'Free';
```

---

### 2. Checkout Transaction (Atomic)

All steps must run inside a single transaction. Any failure → ROLLBACK immediately.

```sql
BEGIN TRANSACTION;

-- Step 1: Lock rows with SELECT FOR UPDATE (prevents race conditions)
-- If another transaction already holds the lock, this query waits.
SELECT status
FROM reserved_seats
WHERE showing_id = :showing_id
  AND seat_id IN (:seat_ids)
FOR UPDATE;

-- Step 2: Verify all selected seats are still 'Free'
-- (Application checks the result above; if any seat is not Free → ROLLBACK)

-- Step 3: Change seat status Free → Reserved
UPDATE reserved_seats
SET status = 'Reserved'
WHERE showing_id = :showing_id
  AND seat_id IN (:seat_ids)
  AND status = 'Free';  -- Double-check to guard against race conditions

-- Step 4: Update booking status
UPDATE booking
SET status = 'Checkout'
WHERE booking_id = :booking_id;

COMMIT;
-- 5-minute payment timer starts here.
```

```sql
-- On successful payment
BEGIN TRANSACTION;

UPDATE reserved_seats
SET status = 'Confirmed'
WHERE showing_id = :showing_id
  AND seat_id IN (:seat_ids);

UPDATE booking
SET status = 'Successful'
WHERE booking_id = :booking_id;

COMMIT;
```

```sql
-- On timeout (Scheduler runs every ~1 minute)
BEGIN TRANSACTION;

UPDATE reserved_seats
SET status = 'Free'
WHERE showing_id = :showing_id
  AND seat_id IN (:seat_ids)
  AND status = 'Reserved';

UPDATE booking
SET status = 'Cancel'
WHERE booking_id = :booking_id
  AND status = 'Checkout';

COMMIT;
-- Also apply 30-minute user ban.
```

---

### 3. Overlap Check (Screen Management)

Run this before creating a new `showing`. If `conflict_count > 0`, creation must be blocked.

```sql
SELECT COUNT(*) AS conflict_count
FROM showing sg
WHERE sg.venues_id     = :venues_id
  AND sg.showtime_date = :new_date
  AND sg.status       != 'Overdue'
  AND :new_start_time  < sg.end_time   -- new slot starts before existing ends
  AND :new_end_time    > sg.start_time; -- new slot ends after existing starts
```

---

### 4. Reporting Queries

```sql
-- Revenue: total revenue grouped by month
-- NOTE: JOIN reserved_seats on BOTH showing_id AND seat_id.
-- Joining on seat_id alone produces a Cartesian product → inflated numbers.
SELECT
  YEAR(b.date)       AS year,
  MONTH(b.date)      AS month,
  SUM(rs.seat_price) AS total_revenue
FROM booking b
JOIN booking_items  bi ON b.booking_id   = bi.booking_id
JOIN reserved_seats rs ON rs.showing_id  = b.showing_id
                       AND rs.seat_id    = bi.seat_id
WHERE b.status = 'Successful'
GROUP BY YEAR(b.date), MONTH(b.date)
ORDER BY year, month;
```

```sql
-- Occupancy Rate: seats sold vs total seats per screening slot
SELECT
  sg.showing_id,
  st.showtime_title,
  v.venues_name,
  sg.showtime_date,
  sg.start_time,
  COUNT(CASE WHEN rs.status = 'Confirmed' THEN 1 END)   AS sold,
  COUNT(*)                                               AS total_seats,
  ROUND(
    COUNT(CASE WHEN rs.status = 'Confirmed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) AS occupancy_rate
FROM reserved_seats rs
JOIN showing   sg ON rs.showing_id = sg.showing_id
JOIN showtimes st ON sg.show_id    = st.show_id
JOIN venues    v  ON sg.venues_id  = v.venues_id
GROUP BY sg.showing_id, st.showtime_title, v.venues_name, sg.showtime_date, sg.start_time;
```

```sql
-- Popularity: movies ranked by tickets sold
-- Must JOIN through showing because booking references showing_id, not show_id directly.
SELECT
  st.show_id,
  st.showtime_title,
  COUNT(bi.seat_id) AS tickets_sold
FROM showtimes     st
JOIN showing       sg ON st.show_id    = sg.show_id
JOIN booking       b  ON sg.showing_id = b.showing_id
JOIN booking_items bi ON b.booking_id  = bi.booking_id
WHERE b.status = 'Successful'
GROUP BY st.show_id, st.showtime_title
ORDER BY tickets_sold DESC;
```

```sql
-- Peak Hours: time slots with the highest booking volume
SELECT
  HOUR(sg.start_time) AS hour_slot,
  COUNT(bi.seat_id)   AS tickets_sold
FROM showing       sg
JOIN booking       b  ON sg.showing_id = b.showing_id
JOIN booking_items bi ON b.booking_id  = bi.booking_id
WHERE b.status = 'Successful'
GROUP BY HOUR(sg.start_time)
ORDER BY tickets_sold DESC;
```

---

## Constraints & Business Rules

### Unique Constraints

| Table            | Column(s)                                | Reason                                                        |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `users_profile`  | `username`                               | Two accounts cannot share the same username                   |
| `users_profile`  | `email`                                  | Each account must have a unique email address                 |
| `reserved_seats` | `(showing_id, seat_id)`                  | One seat has exactly one status record per screening slot     |
| `booking_items`  | `(booking_id, seat_id)`                  | The same seat cannot be added twice to the same booking       |
| `contain_seats`  | `(venues_id, seat_id)`                   | Each seat belongs to exactly one venue                        |
| `showing`        | `(venues_id, showtime_date, start_time)` | A hall can have only one screening at any given date and time |

---

### Domain Constraints

| Table.Column                | Rule                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `reserved_seats.status`     | ENUM: `'Free'`, `'Reserved'`, `'Confirmed'` only                 |
| `booking.status`            | ENUM: `'Booking'`, `'Checkout'`, `'Successful'`, `'Cancel'` only |
| `showing.status`            | ENUM: `'Ontime'`, `'Overdue'`, `'Full'` only                     |
| `showtimes.status`          | ENUM: `'Active'`, `'Inactive'` only                              |
| `users_profile.role`        | ENUM: `'Customer'`, `'Admin'` only                               |
| `reserved_seats.seat_price` | CHECK: `seat_price > 0`                                          |
| `showtimes.duration`        | CHECK: `duration > 0`                                            |

---

### Referential Integrity (ON DELETE)

Be careful of cascading effects before deleting records.

| Deleting from | Must handle first                                                              |
| ------------- | ------------------------------------------------------------------------------ |
| `showtimes`   | Ensure no active `showing` records reference it                                |
| `showing`     | Delete all related `reserved_seats` rows                                       |
| `venues`      | Delete all related `contain_seats` and `showing` rows                          |
| `seats`       | Delete all related `contain_seats`, `reserved_seats`, and `booking_items` rows |

Recommended: use `ON DELETE RESTRICT` so the database blocks deletions that still have child records.

---

### Seat Exclusivity — Race Condition Prevention

> **Problem:** User A and User B select the same seat simultaneously. A check-then-update in two separate steps can be overwritten by a concurrent transaction.
>
> **Solution:** Use `SELECT FOR UPDATE` (row-level lock) during checkout.
> The second transaction must wait until the first commits or rolls back before it can proceed.
>
> If the first transaction successfully locks and reserves the seat, the second transaction will see `status = 'Reserved'` and immediately notify the user before any payment is attempted.

---

### Payment Timer

> A seat with `status = 'Reserved'` must be paid within **5 minutes**.
>
> **Recommended implementation: Application Scheduler**
> Run a background job every ~1 minute. Find all bookings where `status = 'Checkout'`
> and the booking time is more than 5 minutes ago, then execute the rollback transaction.
>
> **Alternative: Database Trigger** — harder to implement correctly for time-based logic; not recommended.
>
> On expiry: `reserved_seats.status → 'Free'`, `booking.status → 'Cancel'`, user banned for 30 minutes.

---

### PDPA Status

> `PDPA_status` is a BOOLEAN that must equal `TRUE` before the system allows a user to proceed with booking.
> Enforced at the application layer when the user attempts to access the seat selection page.

---

## Status Definitions

### Seat Status (`reserved_seats.status`)

| Status      | Meaning                                                 | Can transition to                   |
| ----------- | ------------------------------------------------------- | ----------------------------------- |
| `Free`      | Seat is available for booking                           | → `Reserved`                        |
| `Reserved`  | Locked during checkout; awaiting payment (5-min window) | → `Confirmed` or → `Free` (timeout) |
| `Confirmed` | Payment successful; seat is secured                     | (final state)                       |

---

### Booking Status (`booking.status`)

| Status       | Meaning                                  | Can transition to            |
| ------------ | ---------------------------------------- | ---------------------------- |
| `Booking`    | User is selecting seats; still editable  | → `Checkout`                 |
| `Checkout`   | Confirmed by user; awaiting payment      | → `Successful` or → `Cancel` |
| `Successful` | Payment completed                        | (final state)                |
| `Cancel`     | Cancelled due to timeout or admin action | (final state)                |

---

### Showing Status (`showing.status`)

| Status    | Meaning                                       |
| --------- | --------------------------------------------- |
| `Ontime`  | Screening is scheduled and open for booking   |
| `Overdue` | Screening time has passed; booking is closed  |
| `Full`    | All seats are `Confirmed`; no seats remaining |

---

### Movie Status (`showtimes.status`)

| Status     | Meaning                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `Active`   | Movie is in the program; new `showing` records can be created             |
| `Inactive` | Movie has been removed from the program; no new `showing` records allowed |

---

## Future Improvements

### Group Booking

To support group bookings (one transaction for multiple users), add a junction table:

```
booking_users
├── booking_users_id  (PK)
├── booking_id        (FK → booking)
└── users_id          (FK → users_profile)
```

Replace `booking.users_id` with `booking_users_id` to allow one booking to be associated with multiple users.

#### Benefits

- Support child / adult price tiers within the same booking.
- Apply per-person promotions independently.
- Personalized ticket names for each attendee (souvenir tickets).

---

_Documentation prepared for the Database Systems Final Project._
