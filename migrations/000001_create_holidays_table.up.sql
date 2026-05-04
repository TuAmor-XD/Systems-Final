CREATE TABLE IF NOT EXISTS holidays (
    id       SERIAL      PRIMARY KEY,
    day      TEXT        NOT NULL,
    date     DATE        NOT NULL,
    year     INT         NOT NULL,
    occasion TEXT        NOT NULL
);

-- Belize Public and Bank Holidays 2026
-- Source: Government of Belize Press Release PR#218-25, November 6 2025

INSERT INTO holidays (day, date, year, occasion) VALUES
    ('Thursday',  '2026-01-01', 2026, 'New Year''s Day'),
    ('Thursday',  '2026-01-15', 2026, 'George Price Day'),
    ('Monday',    '2026-03-09', 2026, 'National Heroes and Benefactor Day'),
    ('Friday',    '2026-04-03', 2026, 'Good Friday'),
    ('Saturday',  '2026-04-04', 2026, 'Holy Saturday'),
    ('Monday',    '2026-04-06', 2026, 'Easter Monday'),
    ('Friday',    '2026-05-01', 2026, 'Labour Day'),
    ('Saturday',  '2026-08-01', 2026, 'Emancipation Day'),
    ('Thursday',  '2026-09-10', 2026, 'St. George''s Caye Day'),
    ('Monday',    '2026-09-21', 2026, 'Independence Day'),
    ('Monday',    '2026-10-12', 2026, 'Indigenous People''s Resistance Day'),
    ('Thursday',  '2026-11-19', 2026, 'Garifuna Settlement Day'),
    ('Friday',    '2026-12-25', 2026, 'Christmas Day'),
    ('Saturday',  '2026-12-26', 2026, 'Boxing Day');
