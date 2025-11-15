-- Eco-Nexus SCOS Snowflake Schema
-- Run this script in your Snowflake trial account to set up the analytics database

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS ECO_NEXUS;
USE DATABASE ECO_NEXUS;

-- Create schema
CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- Create decisions table to store negotiation results
CREATE TABLE IF NOT EXISTS decisions (
    decision_id VARCHAR(255) PRIMARY KEY,
    vendor_id VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    carbon DECIMAL(10, 2) NOT NULL,
    delivery_days INTEGER NOT NULL,
    sustainability_score DECIMAL(3, 1) NOT NULL,
    cost_saved DECIMAL(10, 2) NOT NULL,
    carbon_saved DECIMAL(10, 2) NOT NULL,
    scc_tokens DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Create index on created_at for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);

-- Create index on vendor_id for vendor-specific analytics
CREATE INDEX IF NOT EXISTS idx_decisions_vendor_id ON decisions(vendor_id);

-- View for monthly analytics
CREATE OR REPLACE VIEW monthly_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as decisions_count,
    SUM(carbon_saved) as total_carbon_saved,
    SUM(cost_saved) as total_cost_saved,
    SUM(scc_tokens) as total_tokens_earned,
    AVG(sustainability_score) as avg_sustainability_score
FROM decisions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View for vendor performance
CREATE OR REPLACE VIEW vendor_performance AS
SELECT 
    vendor_id,
    vendor_name,
    COUNT(*) as times_selected,
    AVG(price) as avg_price,
    AVG(carbon) as avg_carbon,
    AVG(sustainability_score) as avg_sustainability_score,
    SUM(cost_saved) as total_cost_saved,
    SUM(carbon_saved) as total_carbon_saved
FROM decisions
GROUP BY vendor_id, vendor_name
ORDER BY times_selected DESC;

-- Sample insert (for testing)
-- INSERT INTO decisions (
--     decision_id, vendor_id, vendor_name, price, carbon, 
--     delivery_days, sustainability_score, cost_saved, 
--     carbon_saved, scc_tokens
-- ) VALUES (
--     'test-001',
--     'vendor-1',
--     'GreenTech Solutions',
--     12.50,
--     18.0,
--     2,
--     9.0,
--     2.50,
--     5.2,
--     15.5
-- );

