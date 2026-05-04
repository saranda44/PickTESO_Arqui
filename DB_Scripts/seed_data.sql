BEGIN;

-- =========================================================
-- PickTESO - Mock Data (desarrollo / testing)
-- Tablas: users, stores, products, tags, product_tags
-- =========================================================

-- ---------------------------------------------------------
-- users (1 platform_admin, 4 store_admins, 10 customers)
-- ---------------------------------------------------------
INSERT INTO users (first_name, paternal_last_name, maternal_last_name, email, role, active) VALUES
-- platform admin
('Carlos',    'Mendoza',   'Ríos',       'carlos.mendoza@pickteso.mx',       'platform_admin', TRUE),

-- store admins
('Sofía',     'Ramírez',   'Torres',     'sofia.ramirez@pickteso.mx',         'store_admin',    TRUE),
('Javier',    'López',     'Herrera',    'javier.lopez@pickteso.mx',          'store_admin',    TRUE),
('Daniela',   'Guerrero',  'Castillo',   'daniela.guerrero@pickteso.mx',      'store_admin',    TRUE),
('Andrés',    'Morales',   'Vega',       'andres.morales@pickteso.mx',        'store_admin',    TRUE),

-- customers
('Valentina', 'Cruz',      'Salinas',    'valentina.cruz@alumnos.teso.mx',    'customer',       TRUE),
('Emilio',    'Sánchez',   'Pérez',      'emilio.sanchez@alumnos.teso.mx',    'customer',       TRUE),
('Mariana',   'Flores',    'Gutiérrez',  'mariana.flores@alumnos.teso.mx',    'customer',       TRUE),
('Diego',     'Reyes',     'Jiménez',    'diego.reyes@alumnos.teso.mx',       'customer',       TRUE),
('Camila',    'Ortega',    'Ruiz',       'camila.ortega@alumnos.teso.mx',     'customer',       TRUE),
('Rodrigo',   'Vargas',    'Mendez',     'rodrigo.vargas@alumnos.teso.mx',    'customer',       TRUE),
('Isabella',  'Núñez',     'Romero',     'isabella.nunez@alumnos.teso.mx',    'customer',       TRUE),
('Sebastián', 'Castro',    'Lara',       'sebastian.castro@alumnos.teso.mx',  'customer',       TRUE),
('Lucía',     'Ramos',     'Montes',     'lucia.ramos@alumnos.teso.mx',       'customer',       TRUE),
('Fernando',  'Aguilar',   'Espinoza',   'fernando.aguilar@alumnos.teso.mx',  'customer',       TRUE);

-- ---------------------------------------------------------
-- stores (4 cafeterías, cada una con su admin)
-- admin_id referencia al id de los store_admins insertados arriba (ids 2–5)
-- ---------------------------------------------------------
INSERT INTO stores (name, location, admin_id, opening_time, closing_time, active) VALUES
('Cafetería Central',       'Edificio A, Planta Baja',   2, '08:00', '19:00', TRUE),
('La Taquiza del TESO',     'Edificio C, Nivel 1',       3, '08:00', '18:00', TRUE),
('Bites & Coffee',          'Biblioteca, Planta Baja',   4, '08:00', '19:00', TRUE),
('El Rincón Saludable',     'Edificio F, Acceso Norte',  5, '09:00', '17:00', TRUE);

-- ---------------------------------------------------------
-- tags (categorías/horarios por tienda)
-- store_id 1 = Cafetería Central
-- store_id 2 = La Taquiza del TESO
-- store_id 3 = Bites & Coffee
-- store_id 4 = El Rincón Saludable
-- ---------------------------------------------------------
INSERT INTO tags (store_id, name, description, start_time, end_time, active) VALUES
-- Cafetería Central
(1, 'Desayuno',   'Platillos disponibles en la mañana',         '08:00', '11:00', TRUE),
(1, 'Comida',     'Menú del mediodía',                          '12:00', '15:00', TRUE),
(1, 'Antojitos',  'Snacks y antojos disponibles todo el día',   '08:00', '19:00', TRUE),
(1, 'Bebidas',    'Aguas, refrescos y jugos',                   '08:00', '19:00', TRUE),

-- La Taquiza del TESO
(2, 'Tacos',      'Tacos de diferentes guisos',                 '10:00', '18:00', TRUE),
(2, 'Quesadillas','Quesadillas con o sin queso',                '10:00', '18:00', TRUE),
(2, 'Bebidas',    'Aguas frescas y refrescos',                  '10:00', '18:00', TRUE),

-- Bites & Coffee
(3, 'Café',       'Bebidas calientes a base de café',           '08:00', '19:00', TRUE),
(3, 'Frío',       'Bebidas frías y frapés',                     '08:00', '19:00', TRUE),
(3, 'Snacks',     'Sándwiches, bagels y paninis',               '08:00', '17:00', TRUE),
(3, 'Repostería', 'Muffins, pays y galletas',                   '08:00', '18:00', TRUE),

-- El Rincón Saludable
(4, 'Bowls',      'Bowls nutritivos con proteína y verduras',   '09:00', '17:00', TRUE),
(4, 'Jugos',      'Jugos naturales y smoothies',                '09:00', '17:00', TRUE),
(4, 'Ensaladas',  'Ensaladas frescas personalizables',          '10:00', '16:00', TRUE);

-- ---------------------------------------------------------
-- products
-- store_id 1 = Cafetería Central
-- ---------------------------------------------------------
INSERT INTO products (store_id, name, description, price, active) VALUES
-- Cafetería Central - Desayuno / Antojitos
(1, 'Chilaquiles rojos',        'Con pollo, crema y queso',                         65.00, TRUE),
(1, 'Chilaquiles verdes',       'Con pollo, crema y queso',                         65.00, TRUE),
(1, 'Molletes',                 'Pan con frijoles, queso y pico de gallo',           50.00, TRUE),
(1, 'Huevos a la mexicana',     'Con tortillas y frijoles',                          60.00, TRUE),
(1, 'Enchiladas verdes',        'Tres enchiladas con pollo y crema',                 70.00, TRUE),
(1, 'Arroz con pollo',          'Porción de arroz con pierna de pollo guisada',      75.00, TRUE),
(1, 'Sopa de fideo',            'Sopa seca de fideo con crema',                      45.00, TRUE),
(1, 'Elote en vaso',            'Con mayonesa, crema, queso y chile',                30.00, TRUE),
(1, 'Agua de Jamaica',          'Vaso grande 500ml',                                 20.00, TRUE),
(1, 'Agua de Horchata',         'Vaso grande 500ml',                                 20.00, TRUE),
(1, 'Refresco',                 'Lata 355ml surtido',                                18.00, TRUE),

-- La Taquiza del TESO
(2, 'Taco de Bistec',           'Con cebolla, cilantro y salsa',                     18.00, TRUE),
(2, 'Taco de Pastor',           'Con piña, cebolla y cilantro',                      18.00, TRUE),
(2, 'Taco de Pollo',            'Pollo guisado, cebolla y cilantro',                 16.00, TRUE),
(2, 'Taco de Nopales',          'Con frijoles y queso fresco',                       14.00, TRUE),
(2, 'Quesadilla de Queso',      'Tortilla de maíz con queso Oaxaca',                 30.00, TRUE),
(2, 'Quesadilla de Hongos',     'Con epazote y queso',                               35.00, TRUE),
(2, 'Quesadilla de Tinga',      'Tinga de pollo con queso',                          38.00, TRUE),
(2, 'Agua Fresca del Día',      'Vaso 400ml, sabor variable',                        18.00, TRUE),
(2, 'Refresco',                 'Lata 355ml surtido',                                18.00, TRUE),

-- Bites & Coffee
(3, 'Americano',                'Espresso con agua caliente, 12oz',                  45.00, TRUE),
(3, 'Capuchino',                'Espresso con leche vaporizada, 12oz',               52.00, TRUE),
(3, 'Latte',                    'Espresso con leche, 12oz',                          55.00, TRUE),
(3, 'Latte de Vainilla',        'Latte con jarabe de vainilla, 12oz',                58.00, TRUE),
(3, 'Frapé de Café',            'Bebida fría con café y hielo, 16oz',                65.00, TRUE),
(3, 'Frapé de Chocolate',       'Bebida fría con chocolate y hielo, 16oz',           68.00, TRUE),
(3, 'Té Matcha Latte',          'Matcha con leche vaporizada, 12oz',                 62.00, TRUE),
(3, 'Sándwich de Jamón y Queso','En pan ciabatta con lechuga y tomate',              70.00, TRUE),
(3, 'Bagel de Queso Crema',     'Bagel tostado con queso crema y pepino',            60.00, TRUE),
(3, 'Muffin de Arándano',       'Muffin horneado del día',                           35.00, TRUE),
(3, 'Galleta de Chispas',       'Galleta de mantequilla con chispas de chocolate',   25.00, TRUE),

-- El Rincón Saludable
(4, 'Bowl Proteico',            'Arroz integral, pollo a la plancha, aguacate y verduras', 110.00, TRUE),
(4, 'Bowl Vegano',              'Quinoa, garbanzos, espinaca, betabel y aderezo tahini',   105.00, TRUE),
(4, 'Bowl Mixto',               'Arroz, atún, pepino, zanahoria y semillas',               100.00, TRUE),
(4, 'Ensalada César',           'Lechuga romana, crutones, parmesano y aderezo césar',      85.00, TRUE),
(4, 'Ensalada de Espinaca',     'Con fresas, nueces, queso de cabra y vinagreta',            90.00, TRUE),
(4, 'Jugo Verde',               'Espinaca, pepino, apio, manzana y limón, 400ml',            55.00, TRUE),
(4, 'Jugo Naranja-Zanahoria',   'Naranja, zanahoria y jengibre, 400ml',                      50.00, TRUE),
(4, 'Smoothie de Fresa',        'Fresa, plátano, leche de almendra y miel, 400ml',           65.00, TRUE);

-- ---------------------------------------------------------
-- product_tags
-- Asociamos cada producto a sus tags correspondientes
-- ---------------------------------------------------------

-- Cafetería Central
-- productos ids: 1-11 (asumiendo inserción limpia desde 1)
-- tags ids: 1=Desayuno, 2=Comida, 3=Antojitos, 4=Bebidas

INSERT INTO product_tags (product_id, tag_id) VALUES
-- Chilaquiles rojos → Desayuno
(1, 1),
-- Chilaquiles verdes → Desayuno
(2, 1),
-- Molletes → Desayuno
(3, 1),
-- Huevos a la mexicana → Desayuno
(4, 1),
-- Enchiladas verdes → Comida
(5, 2),
-- Arroz con pollo → Comida
(6, 2),
-- Sopa de fideo → Comida
(7, 2),
-- Elote en vaso → Antojitos
(8, 3),
-- Agua de Jamaica → Bebidas
(9, 4),
-- Agua de Horchata → Bebidas
(10, 4),
-- Refresco → Bebidas
(11, 4),

-- La Taquiza del TESO
-- productos: 12-20, tags: 5=Tacos, 6=Quesadillas, 7=Bebidas
-- Taco de Bistec → Tacos
(12, 5),
-- Taco de Pastor → Tacos
(13, 5),
-- Taco de Pollo → Tacos
(14, 5),
-- Taco de Nopales → Tacos
(15, 5),
-- Quesadilla de Queso → Quesadillas
(16, 6),
-- Quesadilla de Hongos → Quesadillas
(17, 6),
-- Quesadilla de Tinga → Quesadillas
(18, 6),
-- Agua Fresca → Bebidas
(19, 7),
-- Refresco → Bebidas
(20, 7),

-- Bites & Coffee
-- productos: 21-31, tags: 8=Café, 9=Frío, 10=Snacks, 11=Repostería
-- Americano → Café
(21, 8),
-- Capuchino → Café
(22, 8),
-- Latte → Café
(23, 8),
-- Latte de Vainilla → Café
(24, 8),
-- Frapé de Café → Frío
(25, 9),
-- Frapé de Chocolate → Frío
(26, 9),
-- Té Matcha Latte → Café + Frío posible, lo ponemos en Café
(27, 8),
-- Sándwich → Snacks
(28, 10),
-- Bagel → Snacks
(29, 10),
-- Muffin → Repostería
(30, 11),
-- Galleta → Repostería
(31, 11),

-- El Rincón Saludable
-- productos: 32-39, tags: 12=Bowls, 13=Jugos, 14=Ensaladas
-- Bowl Proteico → Bowls
(32, 12),
-- Bowl Vegano → Bowls
(33, 12),
-- Bowl Mixto → Bowls
(34, 12),
-- Ensalada César → Ensaladas
(35, 14),
-- Ensalada de Espinaca → Ensaladas
(36, 14),
-- Jugo Verde → Jugos
(37, 13),
-- Jugo Naranja-Zanahoria → Jugos
(38, 13),
-- Smoothie de Fresa → Jugos
(39, 13);

COMMIT;