-- Student master registry (Enrollment No through Session).
-- Safe to run in psql: does nothing if the table already exists.
CREATE TABLE IF NOT EXISTS student_master (
    enrollment_no VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    programme VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    session VARCHAR(50) NOT NULL,
    PRIMARY KEY (enrollment_no, semester, session)
);
