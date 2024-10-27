CREATE TABLE IF NOT EXISTS flight_positions (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    geojson JSONB NOT NULL
);