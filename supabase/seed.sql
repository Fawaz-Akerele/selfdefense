-- Sydef seed data — run after migration
-- Safe to re-run: uses ON CONFLICT where applicable

-- Locations (Nigeria)
INSERT INTO sydef.locations (state, city) VALUES
  ('Lagos', 'Ikeja'),
  ('Lagos', 'Lekki'),
  ('Lagos', 'Victoria Island'),
  ('FCT', 'Abuja'),
  ('Rivers', 'Port Harcourt'),
  ('Oyo', 'Ibadan'),
  ('Kano', 'Kano'),
  ('Delta', 'Warri'),
  ('Edo', 'Benin City'),
  ('Enugu', 'Enugu')
ON CONFLICT (state, city) DO NOTHING;

-- Instructors
INSERT INTO sydef.instructors (id, full_name, bio, credentials) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'Dr. Amara Okafor', 'Clinical psychologist specializing in threat assessment and de-escalation.', ARRAY['PhD Psychology', 'Certified Self-Defence Instructor']),
  ('a0000001-0000-4000-8000-000000000002', 'Emeka Nwosu', 'Former security consultant with 15 years teaching situational awareness.', ARRAY['CPP', 'Krav Maga Level 3']),
  ('a0000001-0000-4000-8000-000000000003', 'Fatima Bello', 'Corporate wellness trainer focused on workplace safety psychology.', ARRAY['MSc Behavioural Science', 'OSHA Certified'])
ON CONFLICT (id) DO NOTHING;

-- Classes
INSERT INTO sydef.classes (id, slug, title, description, type, price_ngn, objectives, instructor_id, location_id, session_count, is_published, is_corporate_only) VALUES
  ('b0000001-0000-4000-8000-000000000001', 'situational-awareness-lagos', 'Situational Awareness Masterclass', 'Learn to read environments, identify threats early, and respond with confidence.', 'in_person', 85000, ARRAY['Threat recognition', 'Exit planning', 'Verbal de-escalation'], 'a0000001-0000-4000-8000-000000000002', (SELECT id FROM sydef.locations WHERE state='Lagos' AND city='Ikeja' LIMIT 1), 4, true, false),
  ('b0000001-0000-4000-8000-000000000002', 'psychology-of-fear', 'Psychology of Fear & Response', 'Understand the neuroscience of fear and train your mind-body response under pressure.', 'online', 45000, ARRAY['Fear response cycle', 'Breathing techniques', 'Mental rehearsal'], 'a0000001-0000-4000-8000-000000000001', NULL, 6, true, false),
  ('b0000001-0000-4000-8000-000000000003', 'corporate-security-mindset', 'Corporate Security Mindset', 'Enterprise training on security culture, reporting, and team coordination.', 'corporate', 0, ARRAY['Security culture', 'Incident reporting', 'Team drills'], 'a0000001-0000-4000-8000-000000000003', NULL, 8, true, true),
  ('b0000001-0000-4000-8000-000000000004', 'personal-boundaries-abuja', 'Personal Boundaries & Physical Defence', 'In-person sessions combining boundary-setting psychology with practical techniques.', 'in_person', 95000, ARRAY['Boundary setting', 'Physical escapes', 'Confidence building'], 'a0000001-0000-4000-8000-000000000002', (SELECT id FROM sydef.locations WHERE state='FCT' AND city='Abuja' LIMIT 1), 5, true, false),
  ('b0000001-0000-4000-8000-000000000005', 'digital-safety-online', 'Digital Safety & Social Engineering Defence', 'Protect yourself from manipulation, phishing, and digital stalking.', 'online', 35000, ARRAY['Social engineering', 'Privacy hygiene', 'Scam detection'], 'a0000001-0000-4000-8000-000000000001', NULL, 5, true, false),
  ('b0000001-0000-4000-8000-000000000006', 'hybrid-resilience-program', 'Hybrid Resilience Program', 'Combined online modules and in-person practicum for complete preparedness.', 'hybrid', 120000, ARRAY['Mindset training', 'Physical skills', 'Scenario drills'], 'a0000001-0000-4000-8000-000000000003', (SELECT id FROM sydef.locations WHERE state='Lagos' AND city='Lekki' LIMIT 1), 6, true, false)
ON CONFLICT (id) DO NOTHING;

-- Sessions (upcoming in-person slots)
INSERT INTO sydef.class_sessions (class_id, starts_at, ends_at, capacity, location_id)
SELECT 'b0000001-0000-4000-8000-000000000001', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 20, id
FROM sydef.locations
WHERE state='Lagos' AND city='Ikeja'
  AND NOT EXISTS (SELECT 1 FROM sydef.class_sessions WHERE class_id = 'b0000001-0000-4000-8000-000000000001' AND starts_at > now())
LIMIT 1;

INSERT INTO sydef.class_sessions (class_id, starts_at, ends_at, capacity, location_id)
SELECT 'b0000001-0000-4000-8000-000000000004', now() + interval '10 days', now() + interval '10 days' + interval '2 hours', 15, id
FROM sydef.locations
WHERE state='FCT' AND city='Abuja'
  AND NOT EXISTS (SELECT 1 FROM sydef.class_sessions WHERE class_id = 'b0000001-0000-4000-8000-000000000004' AND starts_at > now())
LIMIT 1;

-- Online modules
INSERT INTO sydef.class_modules (class_id, title, description, sort_order, duration_seconds) VALUES
  ('b0000001-0000-4000-8000-000000000002', 'Understanding the Fear Response', 'How your amygdala and prefrontal cortex interact under threat.', 1, 1200),
  ('b0000001-0000-4000-8000-000000000002', 'Breathing Under Pressure', 'Box breathing and tactical breathing protocols.', 2, 900),
  ('b0000001-0000-4000-8000-000000000002', 'Mental Rehearsal Techniques', 'Visualization for high-stress scenarios.', 3, 1500),
  ('b0000001-0000-4000-8000-000000000005', 'Recognizing Manipulation', 'Common social engineering tactics explained.', 1, 1100),
  ('b0000001-0000-4000-8000-000000000005', 'Digital Privacy Essentials', 'Protecting your personal data and identity.', 2, 1300)
ON CONFLICT DO NOTHING;

-- Corporate packages
INSERT INTO sydef.corporate_packages (id, name, slug, staff_count, price_ngn, description, features, class_ids, sort_order) VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Team Essentials', 'team-essentials-10', 10, 1500000, 'Complete security mindset training for 10 staff members.', ARRAY['10 staff seats', 'Online + in-person options', 'Progress dashboard', 'WhatsApp onboarding'], ARRAY['b0000001-0000-4000-8000-000000000003'::uuid, 'b0000001-0000-4000-8000-000000000002'::uuid], 1),
  ('c0000001-0000-4000-8000-000000000002', 'Enterprise Shield', 'enterprise-shield-50', 50, 6500000, 'Full corporate security program for 50 staff with dedicated support.', ARRAY['50 staff seats', 'All course access', 'Dedicated account manager', 'Custom reporting'], ARRAY['b0000001-0000-4000-8000-000000000003'::uuid, 'b0000001-0000-4000-8000-000000000006'::uuid, 'b0000001-0000-4000-8000-000000000005'::uuid], 2)
ON CONFLICT (id) DO NOTHING;

-- Blog articles
INSERT INTO sydef.articles (slug, title, excerpt, body, status, tags, published_at) VALUES
  ('why-awareness-beats-strength', 'Why Awareness Beats Strength', 'The psychology behind why noticing danger early matters more than physical power.', 'Most assaults are preventable through early detection...', 'published', ARRAY['awareness', 'psychology'], now()),
  ('corporate-security-culture', 'Building a Security Culture at Work', 'How leaders can foster psychological safety and vigilance.', 'Security culture starts with leadership modeling...', 'published', ARRAY['corporate', 'culture'], now()),
  ('ai-tools-for-personal-safety', 'AI Tools for Personal Safety', 'Responsible use of AI apps for threat monitoring and emergency response.', 'AI can augment your awareness but should never replace judgment...', 'published', ARRAY['ai', 'technology'], now()),
  ('de-escalation-techniques', '5 De-escalation Techniques That Work', 'Evidence-based verbal strategies to defuse confrontations.', 'De-escalation is a skill, not an instinct...', 'published', ARRAY['de-escalation', 'techniques'], now()),
  ('travel-safety-nigeria', 'Travel Safety Tips for Nigeria', 'Practical guidance for domestic and international travel.', 'Whether commuting in Lagos or traveling upcountry...', 'published', ARRAY['travel', 'nigeria'], now())
ON CONFLICT (slug) DO NOTHING;
