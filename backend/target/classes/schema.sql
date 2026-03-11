-- Run this ONCE in your PostgreSQL database before starting the app
-- psql -U postgres -d heymatedb -f schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(15)  UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    fcm_token   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT REFERENCES users(id) ON DELETE CASCADE,
    service_type   VARCHAR(50) NOT NULL,
    description    TEXT,
    is_online      BOOLEAN DEFAULT FALSE,
    location       GEOGRAPHY(POINT, 4326),
    rating         DECIMAL(2,1) DEFAULT 5.0,
    total_orders   INT DEFAULT 0,
    price_per_unit VARCHAR(50),
    verified       BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT REFERENCES users(id),
    provider_id  BIGINT REFERENCES providers(id),
    service_type VARCHAR(50),
    status       VARCHAR(30) DEFAULT 'PENDING',
    address      TEXT,
    notes        TEXT,
    price        DECIMAL(10,2),
    scheduled_at TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT REFERENCES bookings(id),
    razorpay_order  VARCHAR(100),
    razorpay_payment VARCHAR(100),
    amount          DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'PENDING',
    method          VARCHAR(30),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT REFERENCES bookings(id),
    user_id     BIGINT REFERENCES users(id),
    provider_id BIGINT REFERENCES providers(id),
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Trusted Contacts (She-Safe)
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name    VARCHAR(100),
    phone   VARCHAR(15),
    email   VARCHAR(100)
);

-- Blood Donors
CREATE TABLE IF NOT EXISTS blood_donors (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
    blood_type   VARCHAR(5) NOT NULL,
    location     GEOGRAPHY(POINT, 4326),
    is_available BOOLEAN DEFAULT TRUE,
    last_donated DATE,
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- Emergency Logs
CREATE TABLE IF NOT EXISTS emergency_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id),
    type       VARCHAR(30),
    latitude   DECIMAL(10,7),
    longitude  DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_providers_location ON providers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_blood_donors_location ON blood_donors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
