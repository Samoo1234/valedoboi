import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// Importar o shared/cors.ts é importante para lidar com CORS
import { corsHeaders } from '../_shared/cors.ts';

console.log('Trigger n8n Report function starting...');

serve(async (req) => {
  // Lidar com requisições preflight CORS (essencial para chamadas do navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Garantir que a requisição seja um POST
    if (req.method !== 'POST') {
      throw new Error('Invalid method. Only POST requests are allowed.');
    }

    // Extrair dados do corpo da requisição
    const { cpfCnpj, startDate, endDate } = await req.json();
    console.log('Received data:', { cpfCnpj, startDate, endDate });

    // Validar se os dados necessários foram recebidos
    if (!cpfCnpj || !startDate || !endDate) {
      throw new Error('Missing required fields: cpfCnpj, startDate, or endDate');
    }

    // Obter a URL do webhook n8n e a API Key das variáveis de ambiente/segredos do Supabase
    const n8nWebhookUrl = Deno.env.get('N8N_REPORT_WEBHOOK_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');

    if (!n8nWebhookUrl) {
      console.error('N8N_REPORT_WEBHOOK_URL environment variable is not set in Supabase.');
      return new Response(
        JSON.stringify({ error: 'Internal server configuration error: Webhook URL not set.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!n8nApiKey) {
      console.error('N8N_API_KEY environment variable is not set in Supabase.');
      return new Response(
        JSON.stringify({ error: 'Internal server configuration error: API Key not set.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Sending request to n8n webhook:', n8nWebhookUrl);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': n8nApiKey, // Adiciona a API Key ao header
        // Adicionar headers de autenticação se o seu webhook n8n precisar
        // Ex: 'Authorization': `Bearer ${Deno.env.get('N8N_AUTH_TOKEN')}`
      },
      body: JSON.stringify({ cpfCnpj, startDate, endDate }), // Envia os dados recebidos para o n8n
    });

    // Verificar se a chamada para o n8n foi bem-sucedida
    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error('n8n webhook call failed:', n8nResponse.status, errorBody);
      // Retorna o status de erro do n8n para o cliente se possível
      return new Response(
        JSON.stringify({ error: `Failed to trigger n8n webhook. Status: ${n8nResponse.status}`, details: errorBody }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: n8nResponse.status, // Repassa o status do n8n
        }
      );
    }

    console.log('n8n webhook triggered successfully.');
    // Tenta pegar a resposta do n8n (se existir e for útil)
    const responseBody = await n8nResponse.text();

    // Retorna sucesso para o frontend
    return new Response(
      JSON.stringify({
        success: true,
        message: 'n8n workflow triggered successfully.',
        n8nResponse: responseBody // Inclui a resposta do n8n se precisar dela no frontend
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error.message);
    // Determina o status de erro apropriado
    let status = 500; // Padrão para erro interno
    if (error instanceof SyntaxError) { // Erro ao parsear JSON
        status = 400; // Bad Request
        error.message = 'Invalid JSON payload';
    } else if (error.message.includes('Missing required fields')) {
        status = 400; // Bad Request
    } else if (error.message.includes('Invalid method')) {
        status = 405; // Method Not Allowed
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status,
      }
    );
  }
});

/*
// Como Implantar e Configurar:
// 1. Instale a Supabase CLI: npm install supabase --save-dev (ou globalmente)
// 2. Login: supabase login
// 3. Vincule seu projeto: supabase link --project-ref SEU_PROJECT_REF
// 4. Defina o segredo (Webhook URL) no Supabase:
//    supabase secrets set N8N_REPORT_WEBHOOK_URL=SUA_URL_N8N_AQUI
//    (Faça isso localmente E também no Dashboard > Project Settings > Secrets)
// 5. Implante a função:
//    supabase functions deploy trigger-n8n-report --no-verify-jwt
//    (Use --no-verify-jwt se a função PODE ser chamada sem autenticação JWT estrita.
//     Para segurança, idealmente você REMOVERIA --no-verify-jwt e garantiria
//     que o frontend envie o token de autenticação Supabase na chamada)
// 6. Teste chamando a URL da função implantada (disponível no dashboard Supabase).
*/
