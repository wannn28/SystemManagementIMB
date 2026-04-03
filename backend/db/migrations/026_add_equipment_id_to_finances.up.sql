-- Link finance rows to heavy equipment for per-unit cost / revenue tracking
ALTER TABLE finances
    ADD COLUMN equipment_id INT UNSIGNED NULL COMMENT 'FK ke equipment (alat berat), opsional';

ALTER TABLE finances
    ADD CONSTRAINT fk_finances_equipment
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;
