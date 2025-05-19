export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restringir para o seu domínio de frontend em produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Permitir POST e OPTIONS (para preflight)
};
