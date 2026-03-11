-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- The tables are auto-created by Spring Boot JPA (ddl-auto=update)
-- This file runs additional setup

-- Create indexes for performance
-- (Run after first Spring Boot startup creates the tables)

-- Index for provider geospatial search
-- CREATE INDEX CONCURRENTLY idx_providers_location ON providers USING GIST(location);
-- CREATE INDEX idx_providers_service_online ON providers(service_type, is_online);

-- Index for blood donors
-- CREATE INDEX CONCURRENTLY idx_blood_donors_location ON blood_donors USING GIST(location);
-- CREATE INDEX idx_blood_donors_type ON blood_donors(blood_type, is_available);

SELECT 'HeyMate database initialized with PostGIS support' AS status;
