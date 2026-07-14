-- V8: Seed image URLs for rewards and partners
-- Author: JDT-17
-- Date: 2026-07-13

-- Seed partner logos
UPDATE mst_partner SET logo_url = 'https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg'
  WHERE code = 'KFC';
UPDATE mst_partner SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg'
  WHERE code = 'MCD';

-- Seed reward images (using real publicly accessible Unsplash food pictures)
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'KFC Original Recipe Chicken 1pc';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'KFC French Fries Regular';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'KFC Zinger Burger';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1598514982901-ae62764ae75e?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'KFC Family Bucket (9pc)';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'KFC Pepsi Regular';

UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'Big Mac Burger';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1562802378-063ec186a863?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'McNuggets 6pcs';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'McFlurry Oreo';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'French Fries Large';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'McCafe Latte';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=400'
  WHERE name = 'McValue Meal (Burger + Fries + Drink)';
