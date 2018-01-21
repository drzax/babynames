-- Up
CREATE TABLE names (
	name TEXT, 
	female INTEGER, 
	male INTEGER, 
	total INTEGER,
	female_prevalence REAL, 
	male_prevalence REAL, 
	total_prevalence REAL
);

CREATE UNIQUE INDEX names_name ON names (name);
CREATE INDEX names_total ON names (total);
CREATE INDEX names_total_prevalence ON names (total_prevalence);

CREATE TABLE years (
	year INTEGER, 
	name TEXT,
	female INTEGER, 
	male INTEGER, 
	total INTEGER,
	female_prevalence REAL, 
	male_prevalence REAL, 
	total_prevalence REAL, 
	PRIMARY KEY(year, name)
);

CREATE INDEX years_year ON years (year);
CREATE INDEX years_name ON years (name);
CREATE INDEX years_total ON years (total);
CREATE INDEX years_total_prevalence ON years (total_prevalence);

-- Down
DROP TABLE names;
DROP TABLE years;