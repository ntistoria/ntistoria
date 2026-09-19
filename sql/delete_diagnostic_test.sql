-- ====================================================================
-- სადიაგნოსტიკო ტესტის სრული წაშლის SQL სქრიპტი
-- NT ისტორია — ntistoria.ge
--
-- გაუშვით ეს სქრიპტი Supabase SQL Editor-ში:
-- 1. წაშლის მოსწავლის პასუხების, მცდელობებისა და კითხვების ცხრილებს
-- 2. წაშლის სადიაგნოსტიკო რუკის ფოტოს photos bucket-იდან
-- ====================================================================

-- 1. წაიშალოს სადიაგნოსტიკო ტესტის ცხრილები (კასკადურად)
DROP TABLE IF EXISTS public.diagnostic_answers CASCADE;
DROP TABLE IF EXISTS public.diagnostic_attempts CASCADE;
DROP TABLE IF EXISTS public.diagnostic_questions CASCADE;

-- 2. სადიაგნოსტიკო რუკის სურათის წაშლა Storage Bucket-იდან (photos)
DELETE FROM storage.objects
WHERE bucket_id = 'photos' AND name = 'diagnostika.PNG';
