-- Categorías sin icono (circle → icono real)
UPDATE categories SET icon = 'credit-card', color = '#6366f1' WHERE name = 'Tarjeta';
UPDATE categories SET icon = 'percent', color = '#ef4444' WHERE name = 'Impuestos';
UPDATE categories SET icon = 'party-popper', color = '#f59e0b' WHERE name = 'Salidas';
UPDATE categories SET icon = 'receipt', color = '#78716c' WHERE name = 'Comisiones';
UPDATE categories SET icon = 'landmark', color = '#0891b2' WHERE name = 'Crédito';
UPDATE categories SET icon = 'dumbbell', color = '#84cc16' WHERE name = 'Deporte';
UPDATE categories SET icon = 'bike', color = '#22c55e' WHERE name = 'Entrenamiento';
UPDATE categories SET icon = 'repeat', color = '#a855f7' WHERE name = 'Suscripciones';
UPDATE categories SET icon = 'circle-ellipsis', color = '#94a3b8' WHERE name = 'Otro';

-- Mejorar iconos existentes según tu feedback
UPDATE categories SET icon = 'shirt' WHERE name = 'Ropa';
UPDATE categories SET icon = 'palm-tree' WHERE name = 'Vacaciones';
UPDATE categories SET icon = 'bike' WHERE name = 'Delivery';