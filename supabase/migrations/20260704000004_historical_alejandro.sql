INSERT INTO public.historical_points (user_id, competition_id, jornada, points)
VALUES
  ('6e13800d-19e0-4b05-ae46-642689d3b4ac', 'a0000000-0000-0000-0000-000000000001', 'group_1', 43),
  ('6e13800d-19e0-4b05-ae46-642689d3b4ac', 'a0000000-0000-0000-0000-000000000001', 'group_2', 49),
  ('6e13800d-19e0-4b05-ae46-642689d3b4ac', 'a0000000-0000-0000-0000-000000000001', 'group_3', 46),
  ('6e13800d-19e0-4b05-ae46-642689d3b4ac', 'a0000000-0000-0000-0000-000000000001', 'r32',     38)
ON CONFLICT (user_id, competition_id, jornada) DO UPDATE SET points = EXCLUDED.points;
