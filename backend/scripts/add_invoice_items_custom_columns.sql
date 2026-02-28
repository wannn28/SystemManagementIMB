-- Migration: Add custom_columns to invoice_items table (untuk kolom template: Volume, Harga/Volume, dll)
-- Date: 2026-02-27

ALTER TABLE invoice_items ADD COLUMN custom_columns TEXT;
