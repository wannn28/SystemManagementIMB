CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    max_duration VARCHAR(50),
    total_revenue DECIMAL,
    amount_paid DECIMAL,
    unit_price DECIMAL,
    total_volume DECIMAL,
    unit VARCHAR(50),
    reports JSONB
);