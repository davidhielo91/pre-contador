-- Add score and viability label columns to Lead
ALTER TABLE "Lead" ADD COLUMN "scoreViabilidad" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "etiquetaViabilidad" TEXT;
