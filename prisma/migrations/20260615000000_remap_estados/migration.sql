-- Remap estados legacy al esquema actual de 5+1 estados pipeline
-- WhatsApp enviado y Correo enviado ya son válidos, se mantienen

-- Intento de llamada → WhatsApp enviado
UPDATE "Lead" SET "estadoLead" = 'WhatsApp enviado'
  WHERE "estadoLead" = 'Intento de llamada';

-- Enviado a landing → Interesado
UPDATE "Lead" SET "estadoLead" = 'Interesado'
  WHERE "estadoLead" = 'Enviado a landing';

-- Agendó diagnóstico → Diagnóstico agendado
UPDATE "Lead" SET "estadoLead" = 'Diagnóstico agendado'
  WHERE "estadoLead" = 'Agendó diagnóstico';

-- No respondió / Cerrado / No viable → No interesado
UPDATE "Lead" SET "estadoLead" = 'No interesado'
  WHERE "estadoLead" IN ('No respondió', 'Cerrado', 'No viable');

-- Remap histórico de estados
UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'WhatsApp enviado'
  WHERE "estadoAnterior" = 'Intento de llamada';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'WhatsApp enviado'
  WHERE "estadoNuevo" = 'Intento de llamada';

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'Interesado'
  WHERE "estadoAnterior" = 'Enviado a landing';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'Interesado'
  WHERE "estadoNuevo" = 'Enviado a landing';

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'Diagnóstico agendado'
  WHERE "estadoAnterior" = 'Agendó diagnóstico';
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'Diagnóstico agendado'
  WHERE "estadoNuevo" = 'Agendó diagnóstico';

UPDATE "LeadStatusHistory" SET "estadoAnterior" = 'No interesado'
  WHERE "estadoAnterior" IN ('No respondió', 'Cerrado', 'No viable');
UPDATE "LeadStatusHistory" SET "estadoNuevo" = 'No interesado'
  WHERE "estadoNuevo" IN ('No respondió', 'Cerrado', 'No viable');
