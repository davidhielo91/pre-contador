-- Remap estados inválidos guardados por bugs del pipeline anterior
-- Causa: handleDragEnd guardaba el nombre de columna como estadoLead
--        y handleWhatsApp usaba "Contactado" que no era un estado válido.

-- "Contactado" (8-column era, handleWhatsApp bug) → WhatsApp enviado
UPDATE "Lead" SET "estadoLead" = 'WhatsApp enviado'
  WHERE "estadoLead" = 'Contactado';

-- "Calificado" (8-column era, drag & drop) → Interesado
UPDATE "Lead" SET "estadoLead" = 'Interesado'
  WHERE "estadoLead" = 'Calificado';

-- "Propuesta enviada" (8-column era, drag & drop) → Diagnóstico realizado
UPDATE "Lead" SET "estadoLead" = 'Diagnóstico realizado'
  WHERE "estadoLead" = 'Propuesta enviada';

-- "Contactado vía WhatsApp" (5-column era, handleDragEnd guardaba nombre de columna) → WhatsApp enviado
UPDATE "Lead" SET "estadoLead" = 'WhatsApp enviado'
  WHERE "estadoLead" = 'Contactado vía WhatsApp';

-- "Agendado" (5-column era, handleDragEnd guardaba nombre de columna) → Diagnóstico agendado
UPDATE "Lead" SET "estadoLead" = 'Diagnóstico agendado'
  WHERE "estadoLead" = 'Agendado';

-- Mismo remap en historial de estados
UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'WhatsApp enviado'
  WHERE "estadoAnterior" IN ('Contactado', 'Contactado vía WhatsApp');
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'WhatsApp enviado'
  WHERE "estadoNuevo" IN ('Contactado', 'Contactado vía WhatsApp');

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'Interesado'
  WHERE "estadoAnterior" = 'Calificado';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'Interesado'
  WHERE "estadoNuevo" = 'Calificado';

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'Diagnóstico realizado'
  WHERE "estadoAnterior" = 'Propuesta enviada';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'Diagnóstico realizado'
  WHERE "estadoNuevo" = 'Propuesta enviada';

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'Diagnóstico agendado'
  WHERE "estadoAnterior" = 'Agendado';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'Diagnóstico agendado'
  WHERE "estadoNuevo" = 'Agendado';
