-- Extend status field to support Partial payment
ALTER TABLE finances MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Unpaid';

-- Add detail fields for complete finance tracking
ALTER TABLE finances
ADD COLUMN no_bukti          VARCHAR(100)  DEFAULT ''  COMMENT 'No. bukti transaksi / invoice / nota',
ADD COLUMN vendor_name       VARCHAR(200)  DEFAULT ''  COMMENT 'Nama vendor atau penerima pembayaran',
ADD COLUMN payment_method    VARCHAR(50)   DEFAULT ''  COMMENT 'Metode pembayaran: tunai, transfer, qris, dll',
ADD COLUMN kategori_utama    VARCHAR(50)   DEFAULT ''  COMMENT 'Kategori utama: operasional, pembelian, aset, pajak, owner',
ADD COLUMN jenis_pajak       VARCHAR(50)   DEFAULT ''  COMMENT 'Jenis pajak: PPN, PPh 21, PPh 23, PPh Final',
ADD COLUMN dpp               DECIMAL(15,2) DEFAULT 0   COMMENT 'Dasar Pengenaan Pajak',
ADD COLUMN ppn               DECIMAL(15,2) DEFAULT 0   COMMENT 'Nilai PPN',
ADD COLUMN pph               DECIMAL(15,2) DEFAULT 0   COMMENT 'Nilai PPh',
ADD COLUMN npwp              VARCHAR(30)   DEFAULT ''  COMMENT 'NPWP vendor/penerima',
ADD COLUMN divisi            VARCHAR(100)  DEFAULT ''  COMMENT 'Divisi, cabang, atau lokasi',
ADD COLUMN penanggung_jawab  VARCHAR(100)  DEFAULT ''  COMMENT 'Penanggung jawab input',
ADD COLUMN tanggal_bayar     VARCHAR(20)   DEFAULT ''  COMMENT 'Tanggal realisasi pembayaran',
ADD COLUMN jatuh_tempo       VARCHAR(20)   DEFAULT ''  COMMENT 'Tanggal jatuh tempo',
ADD COLUMN is_deductible     TINYINT(1)    DEFAULT 0   COMMENT 'Apakah biaya ini deductible/pengurang pajak',
ADD COLUMN catatan           TEXT                      COMMENT 'Catatan atau keterangan tambahan',
ADD COLUMN lampiran_urls     TEXT                      COMMENT 'URL lampiran bukti (JSON array)';

-- Index for common filter fields
ALTER TABLE finances
ADD INDEX idx_finances_vendor       (vendor_name(50)),
ADD INDEX idx_finances_pay_method   (payment_method),
ADD INDEX idx_finances_kat_utama    (kategori_utama);
