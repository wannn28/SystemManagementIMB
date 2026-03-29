ALTER TABLE finances
ADD COLUMN tax_paid TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Status pajak: 1 = sudah bayar, 0 = belum',
ADD INDEX idx_finances_tax_paid (tax_paid);

