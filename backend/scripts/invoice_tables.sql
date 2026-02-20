-- Tabel untuk fitur Invoice
-- Jalankan script ini di database yang dipakai aplikasi (nama DB di config: DB_NAME)
-- Atau biarkan aplikasi Go membuat tabel otomatis lewat GORM AutoMigrate saat pertama run

-- 1. Template invoice
CREATE TABLE IF NOT EXISTS `invoice_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `layout` varchar(100) DEFAULT NULL,
  `options` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Invoice
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `customer_name` varchar(200) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_email` varchar(200) DEFAULT NULL,
  `customer_address` text,
  `subtotal` decimal(15,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `notes` text,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invoices_invoice_number` (`invoice_number`),
  KEY `idx_invoices_template_id` (`template_id`),
  CONSTRAINT `fk_invoices_template` FOREIGN KEY (`template_id`) REFERENCES `invoice_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Item per invoice
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `item_name` varchar(300) NOT NULL,
  `description` text,
  `quantity` int NOT NULL DEFAULT 1,
  `price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `sort_order` int DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice_id` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Kolom tambahan format IMB & BBM (jika tabel sudah ada): gunakan GORM AutoMigrate atau jalankan ALTER manual.
-- ALTER TABLE invoices ADD COLUMN include_bbm_note tinyint(1) DEFAULT 0, ADD COLUMN use_bbm_columns tinyint(1) DEFAULT 0, ADD COLUMN location varchar(100), ADD COLUMN subject varchar(200), ADD COLUMN equipment_name varchar(255), ADD COLUMN intro_paragraph text, ADD COLUMN bank_account varchar(200), ADD COLUMN quantity_unit varchar(50) DEFAULT 'hari', ADD COLUMN price_unit_label varchar(50) DEFAULT 'Harga/Hari', ADD COLUMN item_column_label varchar(50);
-- ALTER TABLE invoice_items ADD COLUMN row_date varchar(50), ADD COLUMN days decimal(10,2) DEFAULT 0, ADD COLUMN bbm_quantity decimal(10,2) DEFAULT 0, ADD COLUMN bbm_unit_price decimal(15,2) DEFAULT 0, ADD COLUMN equipment_group varchar(100);

-- Opsional: seed 3 template default (kalau tidak pakai AutoMigrate + seed di Go)
-- INSERT INTO `invoice_templates` (`name`, `description`, `layout`, `created_at`, `updated_at`) VALUES
-- ('Standard', 'Template invoice sederhana dengan header dan tabel item', 'standard', NOW(3), NOW(3)),
-- ('Minimal', 'Template minimal, cocok untuk nota cepat', 'minimal', NOW(3), NOW(3)),
-- ('Professional', 'Template formal dengan ruang logo dan footer', 'professional', NOW(3), NOW(3));
