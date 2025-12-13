-- ============================================
-- PREDICTIVE MAINTENANCE DATABASE SCHEMA
-- ============================================

-- Create database schema for machine sensor data
-- This will be used to store predictive maintenance data

-- Drop existing table if it exists
DROP TABLE IF EXISTS machine_sensor_data CASCADE;

-- Create main sensor data table
CREATE TABLE machine_sensor_data (
    id SERIAL PRIMARY KEY,
    datetime TIMESTAMP NOT NULL,
    machine_id INTEGER NOT NULL,
    volt DECIMAL(10,6) NOT NULL,
    rotate DECIMAL(10,6) NOT NULL,
    pressure DECIMAL(10,6) NOT NULL,
    vibration DECIMAL(10,6) NOT NULL,
    model VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    failure VARCHAR(50) DEFAULT 'none',
    error_id VARCHAR(50) DEFAULT 'no_error',
    component VARCHAR(50) DEFAULT 'no_maintenance',
    
    -- Indexes for better query performance
    CONSTRAINT chk_machine_id_positive CHECK (machine_id > 0),
    CONSTRAINT chk_volt_positive CHECK (volt > 0),
    CONSTRAINT chk_rotate_positive CHECK (rotate > 0),
    CONSTRAINT chk_pressure_positive CHECK (pressure > 0),
    CONSTRAINT chk_vibration_positive CHECK (vibration > 0),
    CONSTRAINT chk_age_positive CHECK (age >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_machine_sensor_data_datetime ON machine_sensor_data(datetime);
CREATE INDEX idx_machine_sensor_data_machine_id ON machine_sensor_data(machine_id);
CREATE INDEX idx_machine_sensor_data_failure ON machine_sensor_data(failure);
CREATE INDEX idx_machine_sensor_data_error_id ON machine_sensor_data(error_id);
CREATE INDEX idx_machine_sensor_data_component ON machine_sensor_data(component);
CREATE INDEX idx_machine_sensor_data_model ON machine_sensor_data(model);

-- Create composite index for common queries
CREATE INDEX idx_machine_sensor_data_machine_datetime ON machine_sensor_data(machine_id, datetime);
CREATE INDEX idx_machine_sensor_data_failure_error ON machine_sensor_data(failure, error_id);

-- Comments for documentation
COMMENT ON TABLE machine_sensor_data IS 'Machine sensor data for predictive maintenance analysis';
COMMENT ON COLUMN machine_sensor_data.datetime IS 'Timestamp of sensor reading';
COMMENT ON COLUMN machine_sensor_data.machine_id IS 'Unique identifier for machine';
COMMENT ON COLUMN machine_sensor_data.volt IS 'Voltage sensor reading';
COMMENT ON COLUMN machine_sensor_data.rotate IS 'Rotation speed sensor reading';
COMMENT ON COLUMN machine_sensor_data.pressure IS 'Pressure sensor reading';
COMMENT ON COLUMN machine_sensor_data.vibration IS 'Vibration sensor reading';
COMMENT ON COLUMN machine_sensor_data.model IS 'Machine model type';
COMMENT ON COLUMN machine_sensor_data.age IS 'Age of machine in years';
COMMENT ON COLUMN machine_sensor_data.failure IS 'Failure type (none, comp1, comp2, comp3, comp4)';
COMMENT ON COLUMN machine_sensor_data.error_id IS 'Error identifier (no_error, error1, error2, error3, error4, error5)';
COMMENT ON COLUMN machine_sensor_data.component IS 'Component requiring maintenance (no_maintenance, comp1, comp2, comp3, comp4)';

-- Sample queries for validation
-- SELECT COUNT(*) FROM machine_sensor_data;
-- SELECT DISTINCT model FROM machine_sensor_data;
-- SELECT DISTINCT failure FROM machine_sensor_data;
-- SELECT DISTINCT error_id FROM machine_sensor_data;
-- SELECT DISTINCT component FROM machine_sensor_data;
-- SELECT COUNT(DISTINCT machine_id) FROM machine_sensor_data;
-- SELECT MIN(datetime), MAX(datetime) FROM machine_sensor_data;