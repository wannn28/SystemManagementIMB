ALTER TABLE finances
DROP INDEX idx_finances_vendor_name,
DROP INDEX idx_finances_payment_method,
DROP INDEX idx_finances_kategori_utama,
DROP COLUMN no_bukti,
DROP COLUMN vendor_name,
DROP COLUMN payment_method,
DROP COLUMN kategori_utama,
DROP COLUMN jenis_pajak,
DROP COLUMN dpp,
DROP COLUMN ppn,
DROP COLUMN pph,
DROP COLUMN npwp,
DROP COLUMN divisi,
DROP COLUMN penanggung_jawab,
DROP COLUMN tanggal_bayar,
DROP COLUMN jatuh_tempo,
DROP COLUMN is_deductible,
DROP COLUMN catatan,
DROP COLUMN lampiran_urls;

ALTER TABLE finances MODIFY COLUMN status ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid';
