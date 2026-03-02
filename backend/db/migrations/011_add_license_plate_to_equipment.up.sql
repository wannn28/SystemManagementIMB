-- Add license_plate for dump truck (display in invoice Keterangan column)
ALTER TABLE equipment ADD COLUMN license_plate VARCHAR(30) DEFAULT '';
