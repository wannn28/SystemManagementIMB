-- Ensure finance detail columns exist (idempotent, MySQL 5.7+).
-- This is needed when earlier migrations were skipped or failed, so INSERT can work.

-- Add missing columns used by entity.Finance

-- tax_paid
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'tax_paid') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN tax_paid TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Status pajak: 1 = sudah bayar, 0 = belum'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- no_bukti
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'no_bukti') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN no_bukti VARCHAR(100) DEFAULT '''' COMMENT ''No. bukti transaksi / invoice / nota'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- vendor_name
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'vendor_name') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN vendor_name VARCHAR(200) DEFAULT '''' COMMENT ''Nama vendor atau penerima pembayaran'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment_method
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'payment_method') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN payment_method VARCHAR(50) DEFAULT '''' COMMENT ''Metode pembayaran: tunai, transfer, qris, dll'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kategori_utama
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'kategori_utama') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN kategori_utama VARCHAR(50) DEFAULT '''' COMMENT ''Kategori utama: operasional, pembelian, aset, pajak, owner'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- jenis_pajak
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'jenis_pajak') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN jenis_pajak VARCHAR(50) DEFAULT '''' COMMENT ''Jenis pajak: PPN, PPh 21, PPh 23, PPh Final'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- dpp
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'dpp') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN dpp DECIMAL(15,2) DEFAULT 0 COMMENT ''Dasar Pengenaan Pajak'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ppn
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'ppn') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN ppn DECIMAL(15,2) DEFAULT 0 COMMENT ''Nilai PPN'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pph
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'pph') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN pph DECIMAL(15,2) DEFAULT 0 COMMENT ''Nilai PPh'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- npwp
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'npwp') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN npwp VARCHAR(30) DEFAULT '''' COMMENT ''NPWP vendor/penerima'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- divisi
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'divisi') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN divisi VARCHAR(100) DEFAULT '''' COMMENT ''Divisi, cabang, atau lokasi'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- penanggung_jawab
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'penanggung_jawab') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN penanggung_jawab VARCHAR(100) DEFAULT '''' COMMENT ''Penanggung jawab input'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tanggal_bayar
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'tanggal_bayar') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN tanggal_bayar VARCHAR(20) DEFAULT '''' COMMENT ''Tanggal realisasi pembayaran'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- jatuh_tempo
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'jatuh_tempo') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN jatuh_tempo VARCHAR(20) DEFAULT '''' COMMENT ''Tanggal jatuh tempo'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- is_deductible
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'is_deductible') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN is_deductible TINYINT(1) DEFAULT 0 COMMENT ''Apakah biaya ini deductible/pengurang pajak'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- catatan
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'catatan') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN catatan TEXT COMMENT ''Catatan atau keterangan tambahan'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- lampiran_urls
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'lampiran_urls') > 0,
    'SELECT 1',
    'ALTER TABLE finances ADD COLUMN lampiran_urls TEXT COMMENT ''URL lampiran bukti (JSON array)'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

