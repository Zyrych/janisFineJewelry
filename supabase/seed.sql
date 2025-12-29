-- Seed Products for Janis Fine Jewelry
-- Run this in Supabase SQL Editor after running schema.sql

INSERT INTO public.products (name, description, price, category, stock, is_active) VALUES
-- Rings
('Gold Heart Ring', 'Elegant 18k gold heart-shaped ring', 2500.00, 'rings', 10, true),
('Silver Band Ring', 'Simple and classic silver band', 800.00, 'rings', 15, true),
('Diamond Solitaire Ring', 'Stunning diamond solitaire engagement ring', 15000.00, 'rings', 5, true),
('Rose Gold Infinity Ring', 'Beautiful rose gold infinity symbol ring', 1800.00, 'rings', 8, true),

-- Necklaces
('Pearl Pendant Necklace', 'Freshwater pearl on sterling silver chain', 1500.00, 'necklaces', 12, true),
('Gold Chain Necklace', '14k gold chain, 18 inches', 3500.00, 'necklaces', 7, true),
('Heart Locket', 'Silver heart locket that holds two photos', 1200.00, 'necklaces', 10, true),
('Crystal Drop Necklace', 'Swarovski crystal drop pendant', 2000.00, 'necklaces', 6, true),

-- Earrings
('Pearl Stud Earrings', 'Classic freshwater pearl studs', 900.00, 'earrings', 20, true),
('Gold Hoop Earrings', 'Medium-sized 14k gold hoops', 2200.00, 'earrings', 10, true),
('Diamond Stud Earrings', '0.5 carat total diamond studs', 8000.00, 'earrings', 4, true),
('Silver Dangle Earrings', 'Sterling silver with crystal accents', 750.00, 'earrings', 15, true),

-- Bracelets
('Tennis Bracelet', 'Sterling silver with cubic zirconia', 3000.00, 'bracelets', 6, true),
('Gold Charm Bracelet', '14k gold with 3 charms included', 4500.00, 'bracelets', 5, true),
('Leather Wrap Bracelet', 'Brown leather with silver clasp', 600.00, 'bracelets', 20, true),
('Bangle Set', 'Set of 3 gold-plated bangles', 1500.00, 'bracelets', 12, true);

-- Make your test user a superuser (replace with your email)
-- UPDATE public.users SET role = 'superuser' WHERE email = 'your-email@example.com';
