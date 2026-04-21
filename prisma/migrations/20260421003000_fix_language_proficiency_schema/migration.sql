-- Fix: LanguageProficiency enum e tabelas AgentLanguage/Language criadas no schema public
-- em vez do schema app durante migration manual anterior.
-- Corrige a coluna proficiencyLevel para referenciar o enum correto em app.

BEGIN;

-- Passo 1: Converter coluna para TEXT (intermediário)
ALTER TABLE app."AgentLanguage"
  ALTER COLUMN "proficiencyLevel" TYPE TEXT USING "proficiencyLevel"::TEXT;

-- Passo 2: Reconverter para o enum correto (app."LanguageProficiency")
ALTER TABLE app."AgentLanguage"
  ALTER COLUMN "proficiencyLevel" TYPE app."LanguageProficiency"
  USING "proficiencyLevel"::app."LanguageProficiency";

-- Passo 3: Remover duplicatas do schema public
DROP TABLE IF EXISTS public."AgentLanguage" CASCADE;
DROP TABLE IF EXISTS public."Language" CASCADE;
DROP TYPE  IF EXISTS public."LanguageProficiency" CASCADE;

COMMIT;
