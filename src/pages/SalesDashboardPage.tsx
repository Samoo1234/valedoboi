import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import debounce from 'lodash.debounce'; // Importar debounce
import { searchCustomers } from '../services/customerService'; // <<< Removido CustomerSuggestion do import
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Definir interface localmente se não exportada
interface CustomerSuggestion {
  nome: string;
  cpf_cnpj: string; // Ou outro identificador único, se usado
}


import Layout from '../components/layout/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { supabase } from '../supabase/client';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-hot-toast';

// --- Definição do DashboardStat (idealmente mover para um arquivo separado) ---
interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  isLoading?: boolean;
}

const DashboardStat: React.FC<DashboardStatProps> = ({
  title,
  value,
  icon,
  colorClass = 'bg-gray-500',
  isLoading = false,
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClass} text-white`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
// --- Fim da definição do DashboardStat ---

interface SalesItem {
  name: string;
  value: number; // Propriedade retornada pela função SQL para ambos os arrays
}

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  topItemsByQuantity: SalesItem[]; // <<< Nome corrigido
  topItemsByValue: SalesItem[];    // <<< Nome corrigido
  error?: string; // Para capturar erros da função SQL
  details?: string; // Detalhes adicionais do erro SQL
}

// Type guard para verificar se um objeto corresponde à interface SalesData
function isValidSalesData(obj: any): obj is SalesData {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  return (
    Number.isFinite(obj.totalSales) &&
    Number.isFinite(obj.totalOrders) &&
    Number.isFinite(obj.averageTicket) &&
    Array.isArray(obj.topItemsByQuantity) &&
    Array.isArray(obj.topItemsByValue) &&
    obj.topItemsByQuantity.every((item: any) => item && typeof item.name === 'string' && typeof item.value === 'number') &&
    obj.topItemsByValue.every((item: any) => item && typeof item.name === 'string' && typeof item.value === 'number') &&
    (!obj.error || typeof obj.error === 'string') &&
    (!obj.details || typeof obj.details === 'string')
  );
}

const SalesDashboardPage: React.FC = () => {
  const today = new Date();
  const firstDayCurrentMonth = startOfMonth(today);
  const lastDayCurrentMonth = endOfMonth(today);

  const [startDate, setStartDate] = useState(format(firstDayCurrentMonth, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(lastDayCurrentMonth, 'yyyy-MM-dd'));
  const [customerNameInput, setCustomerNameInput] = useState<string>(''); // Input de texto
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null); // Nome SELECIONADO para o filtro
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (start: string, end: string, clientName?: string) => {
    setIsLoading(true);
    setError(null);
    setDashboardData(null); // Limpa dados antigos



    try {
      const params = {
        p_start_date: start,      // <<< Corrigido
        p_end_date: end,        // <<< Corrigido
        p_client_name: !clientName || clientName.trim() === '' ? null : clientName.trim() // <<< Corrigido
      };

      const { data, error: rpcError } = await supabase
        .rpc('calculate_sales_dashboard', params);

      if (rpcError) {
        console.error('Supabase RPC Error:', rpcError);
        throw new Error(`Erro ao chamar função RPC: ${rpcError.message}`);
      }

      // Check if data is null or undefined even if rpcError is null
      if (data === null || data === undefined) {
         console.error('Data is null or undefined despite no RPC error.');
         throw new Error('Resposta do servidor vazia ou inesperada.');
      }

      // Verifica se a função SQL retornou um erro interno (pode não ser necessário com tipagem forte, mas seguro manter)
      // Supabase pode retornar erro dentro do objeto data em alguns casos
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        const errorData = data as any; // Type assertion para acessar error/details
        console.error('SQL Function Error:', errorData.error, errorData.details);
        throw new Error(`Erro na função SQL: ${errorData.error}${errorData.details ? ' - ' + errorData.details : ''}`);
      }


      // Valida a estrutura dos dados recebidos usando o type guard
      if (!isValidSalesData(data)) {
        console.error('Data format error: Received data does not match SalesData structure:', data);
        // Tenta dar uma mensagem mais específica se possível
        if (data === null) throw new Error('Resposta do servidor foi nula.');
        if (typeof data !== 'object') throw new Error(`Resposta do servidor não é um objeto (${typeof data}).`);
        // Outras verificações podem ser adicionadas aqui)
        // Log the type of each field to help debug (use type assertion here)


        throw new Error('Resposta do servidor inválida ou não contém os dados esperados.');
      }


      setDashboardData(data as SalesData); // Agora é seguro definir os dados com type assertion

    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast.error(`Falha ao carregar dados: ${errorMessage}`);
      setDashboardData(null); // Garante que não há dados em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // Busca inicial ao carregar a página
  useEffect(() => {
    fetchDashboardData(startDate, endDate, selectedClientName || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem inicial


  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      // Usa a função searchCustomers importada
      const results = await searchCustomers(searchTerm);
      setSuggestions(results as CustomerSuggestion[]); // Faz type assertion se necessário
    } catch (err) {
      console.error("Erro buscando sugestões de clientes:", err);
      setSuggestions([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // Debounce da busca
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 500), []);

  // Handler para mudança no input de nome
  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCustomerNameInput(name);
    setSelectedClientName(null); // Limpa cliente selecionado ao digitar
    setSuggestions([]); // Limpa sugestões antigas
    if (name.trim().length >= 3) {
        debouncedFetchSuggestions(name);
    } else {
        debouncedFetchSuggestions.cancel(); // Cancela buscas pendentes se texto < 3
        setSuggestions([]);
        // Opcional: Buscar dados gerais ('todos') se campo for limpo?
        // handleFilter(); // Ou chamar fetch diretamente
    }
  };

  // Handler para clique na sugestão
  const handleSuggestionClick = (suggestion: CustomerSuggestion) => {
    setCustomerNameInput(suggestion.nome);
    setSelectedClientName(suggestion.nome); // <<< Usar o nome para o filtro SQL
    setSuggestions([]);
    // Buscar dados imediatamente ao selecionar cliente
    // fetchDashboardData(startDate, endDate, suggestion.nome); // Podemos chamar aqui ou pelo handleFilter
    handleFilter(); // Chama o filtro principal que usará selectedClientName atualizado

  };

  const handleFilter = () => {
    fetchDashboardData(startDate, endDate, selectedClientName || undefined);
  };

  const handlePresetDateRange = (monthsToSubtract: number) => {
    const end = endOfMonth(subMonths(today, monthsToSubtract));
    const start = startOfMonth(subMonths(today, monthsToSubtract));
    const formattedStart = format(start, 'yyyy-MM-dd');
    const formattedEnd = format(end, 'yyyy-MM-dd');
    setStartDate(formattedStart);
    setEndDate(formattedEnd);
    // Limpa CPF/CNPJ ao mudar preset para evitar confusão? Opcional.
    // setSelectedCpfCnpj('');
    fetchDashboardData(formattedStart, formattedEnd, selectedClientName || undefined); // <<< Passar undefined se null
  };

  return (
    <Layout title="Dashboard de Vendas">
      <div className="space-y-6">
        {/* --- Seção de Filtros --- */}
        <Card className="overflow-visible">
          <CardHeader><h2 className="text-lg font-medium">Filtros</h2></CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-end flex-wrap overflow-visible">
            <Input
              label="Data Início"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-grow md:flex-grow-0"
            />
            <Input
              label="Data Fim"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-grow md:flex-grow-0"
            />
              {/* --- Autocomplete Cliente --- */}
              <div className="md:col-span-1 relative"> 
                <label htmlFor="customerNameInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <Input
                  id="customerNameInput"
                  type="text"
                  placeholder="Digite min. 3 letras ou deixe vazio para todos"
                  value={customerNameInput} // <<< Usar estado do input
                  onChange={handleNameInputChange} // <<< Usar handler do input
                  autoComplete="off"
                  className="flex-grow w-full" // Garante que o input ocupe o espaço
                />
                {/* Indicador de busca */}
                {isSearchingCustomers && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
                {/* Lista de sugestões */}
                {suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.cpf_cnpj} // Usar um ID único se disponível
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSuggestionClick(suggestion)} // <<< Usar handler do clique
                      >
                        {suggestion.nome}
                      </li>
                    ))}
                  </ul>
                )}
                 {/* Mensagem se nenhum cliente selecionado após digitar */}
                 {customerNameInput.length >= 3 && !selectedClientName && !isSearchingCustomers && suggestions.length === 0 && (
                    <p className="text-sm text-yellow-600 mt-1">Nenhum cliente encontrado ou selecionado.</p>
                 )}
              </div>
              {/* --- Fim Autocomplete Cliente --- */}
            <div className="flex gap-2 items-end flex-wrap">
              <Button onClick={handleFilter} disabled={isLoading} className="whitespace-nowrap">
                {isLoading ? 'Filtrando...' : 'Aplicar Filtro'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePresetDateRange(0)} disabled={isLoading}>Este Mês</Button>
              <Button variant="outline" size="sm" onClick={() => handlePresetDateRange(1)} disabled={isLoading}>Mês Passado</Button>
            </div>
          </CardContent>
        </Card>

        {/* --- Seção de Métricas Principais --- */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <CardHeader className="text-red-700 font-semibold">Erro ao Carregar Dados</CardHeader>
            <CardContent className="text-red-600">
              <p>{error}</p>
              <p className="text-sm mt-1">Verifique os filtros ou a conexão com o servidor e tente novamente.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStat
            title="Total de Vendas"
            value={dashboardData ? formatCurrency(dashboardData.totalSales) : '--'}
            icon={<DollarSign size={24} />}
            colorClass="bg-emerald-500"
            isLoading={isLoading && !dashboardData} // Mostra loading só se não houver dados ainda
          />
          <DashboardStat
            title="Total de Pedidos"
            value={dashboardData ? dashboardData.totalOrders : '--'}
            icon={<ShoppingCart size={24} />}
            colorClass="bg-blue-500"
            isLoading={isLoading && !dashboardData}
          />
          <DashboardStat
            title="Ticket Médio"
            value={dashboardData ? formatCurrency(dashboardData.averageTicket) : '--'}
            icon={<TrendingUp size={24} />}
            colorClass="bg-orange-500"
            isLoading={isLoading && !dashboardData}
          />
        </div>

        {/* --- Seção de Gráficos --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico Top Itens por Quantidade */}
          <Card>
            <CardHeader><h3 className="text-md font-semibold text-gray-700">Top 5 Itens (Quantidade / Peso)</h3></CardHeader>
            <CardContent className="h-80"> {/* Altura fixa para o container */}
              {(isLoading && !dashboardData) ? (
                <div className="flex items-center justify-center h-full text-gray-500">Carregando gráfico...</div>
              ) : dashboardData && dashboardData.topItemsByQuantity?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.topItemsByQuantity.map(item => ({ name: item.name, Quantidade: item.value }))}
                    margin={{ top: 5, right: 20, left: 10, bottom: 45 }} // Aumenta margem inferior para labels
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* Ajustes no XAxis para melhor leitura */}
                    <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} fontSize={10} height={60} />
                    <YAxis />
                    {/* Tooltip formatado */}
                    <Tooltip formatter={(value: number) => [`${value.toFixed(3)} kg`, 'Quantidade']} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Quantidade" name="Qtd (Kg)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {error ? 'Erro ao carregar' : 'Nenhum dado de item encontrado para este período.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico Top Itens por Valor */}
          <Card>
            <CardHeader><h3 className="text-md font-semibold text-gray-700">Top 5 Itens (Valor)</h3></CardHeader>
            <CardContent className="h-80"> {/* Altura fixa para o container */}
              {(isLoading && !dashboardData) ? (
                <div className="flex items-center justify-center h-full text-gray-500">Carregando gráfico...</div>
              ) : dashboardData && dashboardData.topItemsByValue?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.topItemsByValue.map(item => ({ name: item.name, Valor: item.value }))}
                    margin={{ top: 5, right: 20, left: 20, bottom: 45 }} // Ajusta margens
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* Ajustes no XAxis */}
                    <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} fontSize={10} height={60} />
                    {/* YAxis formatado como moeda */}
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    {/* Tooltip formatado como moeda */}
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor Total']} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="totalValue" name="Valor (R$)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {error ? 'Erro ao carregar' : 'Nenhum dado de item encontrado para este período.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SalesDashboardPage;
