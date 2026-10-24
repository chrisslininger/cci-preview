-- Fill blank personal emails from the email on file (James, 2026-10-24).
-- Only where both personal and professional are blank and the address is not the office email.
-- Run once, live, on 2026-10-24: 372 people.
update public.people
   set personal_email = lower(trim(email))
 where email is not null and trim(email) <> ''
   and personal_email is null and professional_email is null
   and (practice_email is null or lower(practice_email) <> lower(email));
