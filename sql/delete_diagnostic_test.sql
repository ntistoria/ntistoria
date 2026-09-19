-- ====================================================================
-- სადიაგნოსტიკო ტესტის სრული წაშლის SQL სქრიპტი
-- NT ისტორია — ntistoria.ge
--
-- გაუშვით ეს სქრიპტი Supabase SQL Editor-ში:
-- წაშლის მოსწავლის პასუხების, მცდელობებისა და კითხვების ცხრილებს.
-- ====================================================================

-- 1. წაიშალოს სადიაგნოსტიკო ტესტის ცხრილები (კასკადურად)
DROP TABLE IF EXISTS public.diagnostic_answers CASCADE;
DROP TABLE IF EXISTS public.diagnostic_attempts CASCADE;
DROP TABLE IF EXISTS public.diagnostic_questions CASCADE;

-- შენიშვნა: photos bucket-იდან diagnostika.PNG ფოტოს წაშლა:
-- Supabase Dashboard -> Storage -> photos -> იპოვეთ diagnostika.PNG -> წაშლა (Delete).
