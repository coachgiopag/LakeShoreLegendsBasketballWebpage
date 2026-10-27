-- Coach-reserved times: a private, expiring link lets one named client claim a
-- specific opening. The slot itself stays 'open' (so the booking path and its
-- one-live-booking-per-slot guarantee are unchanged); an active, unexpired
-- reservation is what hides it from normal booking and from conflict bumping.
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of the link token; the token itself is never stored
  slot_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  note TEXT,                         -- coach-only
  allowed_type_ids TEXT,             -- JSON array; null = every active session type
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,          -- UTC ISO; an active row past this time counts as expired
  booking_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX reservations_slot ON reservations(slot_id);
-- At most one active reservation per opening.
CREATE UNIQUE INDEX reservations_one_active ON reservations(slot_id) WHERE status = 'active';
