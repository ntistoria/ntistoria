-- ====================================================================
-- სადიაგნოსტიკო ტესტი N1 — რუკის URL-ის განახლების SQL სქრიპტი
-- NT ისტორია — ntistoria.ge
--
-- გაუშვით ეს სქრიპტი Supabase SQL Editor-ში, თუ გსურთ ბაზაში უკვე
-- არსებული კითხვებისთვის რუკის ბმულის ერთბაშად განახლება.
-- ====================================================================

UPDATE public.diagnostic_questions
SET map_url = 'https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/diagnostika.PNG'
WHERE test_id = 'diagnostic-1' AND section = 'II';
