-- AlterTable: agregar segmentoInteres al Lead (A = listo, B = interesado con dudas, C = curioso)
ALTER TABLE "Lead" ADD COLUMN "segmentoInteres" TEXT;
