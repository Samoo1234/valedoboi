import React, { useState, useCallback } from 'react'; // Adicionado useCallback
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
// Importar os serviços reais
import { searchCustomersByName, getOrdersByCpfCnpjAndDateRange, ReportOrderData, ReportOrderItemData } from '../services/reportService';
import debounce from 'lodash.debounce'; 
import { format } from 'date-fns'; // Usar apenas format
import { Printer, MessageCircle } from 'lucide-react'; // Importar ícones
import { toast } from 'react-hot-toast'; // Importar toast

interface CustomerSuggestion {
  nome: string;
  cpf_cnpj: string;
}

// Renomeado para refletir que agora usa dados reais
interface MonthlyRealOrdersReport {
  monthYear: string;
  orders: ReportOrderData[]; 
  totalAmount: number;
}

const CustomerOrdersReportPage = () => {
  const [customerNameInput, setCustomerNameInput] = useState<string>(''); 
  const [selectedCpfCnpj, setSelectedCpfCnpj] = useState<string | null>(null); 
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]); 
  const [isSearchingCustomers, setIsSearchingCustomers] = useState<boolean>(false); 
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<MonthlyRealOrdersReport[]>([]); 
  const [isLoadingReport, setIsLoadingReport] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false); // Novo estado
  const [isSendingToWhatsApp, setIsSendingToWhatsApp] = useState(false); // Novo estado para o envio ao n8n

  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const results = await searchCustomersByName(searchTerm);
      setSuggestions(results);
    } catch (err) {
      console.error("Erro buscando sugestões de clientes:", err);
      setSuggestions([]); 
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 500), []);

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCustomerNameInput(name);
    setSelectedCpfCnpj(null); 
    setError(null); 
    setReportData([]); 
    setSearchAttempted(false); // Resetar ao mudar cliente
    debouncedFetchSuggestions(name);
  };

  const handleSuggestionClick = (suggestion: CustomerSuggestion) => {
    setCustomerNameInput(suggestion.nome); 
    setSelectedCpfCnpj(suggestion.cpf_cnpj); 
    setSuggestions([]); 
  };

  const handleGenerateReport = async () => {
    if (!selectedCpfCnpj) {
      setError('Por favor, selecione um cliente válido.');
      setReportData([]);
      return;
    }
    if (!startDate || !endDate) {
      setError('Por favor, selecione a data de início e a data de fim.');
      setReportData([]);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('A data de início não pode ser posterior à data de fim.');
      setReportData([]);
      return;
    }

    setError(null); // Limpa erro anterior
    setIsLoadingReport(true); // Inicia loading do relatório
    setReportData([]); // Limpa dados anteriores
    setSearchAttempted(true); // Marcar que a busca foi tentada

    try {
      const orders = await getOrdersByCpfCnpjAndDateRange(selectedCpfCnpj, startDate, endDate);

      if (orders.length === 0) {
        // Não definir erro aqui, apenas mostrar mensagem de "nenhum pedido"
      } else {
        // Agrupar e calcular totais
        const grouped = orders.reduce((acc: Record<string, MonthlyRealOrdersReport>, order: ReportOrderData) => {
          const orderDate = new Date(order.data_criacao); 
          const month = orderDate.toLocaleString('pt-BR', { month: 'long' }); 
          const year = orderDate.getFullYear();
          const monthYearKey = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;

          if (!acc[monthYearKey]) {
            acc[monthYearKey] = {
              monthYear: monthYearKey,
              orders: [],
              totalAmount: 0,
            };
          }
          acc[monthYearKey].orders.push(order);
          acc[monthYearKey].totalAmount += order.valor_total; 
          return acc;
        }, {} as Record<string, MonthlyRealOrdersReport>); 

        const sortedReport = Object.values(grouped).sort((a, b) => {
          const dateA = new Date(a.orders[0].data_criacao); 
          const dateB = new Date(b.orders[0].data_criacao);
          if (dateA.getFullYear() !== dateB.getFullYear()) {
            return dateB.getFullYear() - dateA.getFullYear(); 
          }
          return dateB.getMonth() - dateA.getMonth(); 
        });

        setReportData(sortedReport);
      }
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      const errorMsg = err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao buscar o relatório.";
      setError(errorMsg); 
      setReportData([]);
      toast.error(errorMsg); 
    } finally {
      setIsLoadingReport(false); // Finaliza loading
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendToN8N = async () => {
    if (!selectedCpfCnpj) {
      toast.error('Por favor, selecione um cliente válido para enviar.');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Por favor, selecione a data de início e a data de fim para enviar.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('A data de início não pode ser posterior à data de fim.');
      return;
    }

    setIsSendingToWhatsApp(true);
    setError(null); // Limpa erro anterior de relatório se houver

    const supabaseFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-n8n-report`;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(supabaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          // Se você remover --no-verify-jwt do deploy da função, precisará do token de autenticação:
          // 'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: JSON.stringify({
          cpfCnpj: selectedCpfCnpj,
          startDate: startDate,
          endDate: endDate,
        }),
      });

      const responseData = await response.json(); // Tenta ler o JSON independentemente do status

      if (!response.ok) {
        console.error('Erro ao enviar para o n8n:', responseData);
        throw new Error(responseData.error || `Falha ao contatar o serviço de envio. Status: ${response.status}`);
      }

      toast.success(responseData.message || 'Informações enviadas para processamento via WhatsApp com sucesso!');
      // console.log('Resposta do n8n:', responseData.n8nResponse);

    } catch (err) {
      console.error('Erro ao chamar a Edge Function para n8n:', err);
      const errorMsg = err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao tentar o envio.";
      setError(errorMsg); // Mostrar erro na UI também, se relevante
      toast.error(errorMsg);
    } finally {
      setIsSendingToWhatsApp(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalGeral = reportData.reduce((sum, month) => sum + month.totalAmount, 0);

  return (
    <Layout title="Relatório de Pedidos por Cliente">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-800">Gerar Relatório Mensal por Cliente</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"> 
              <div className="md:col-span-1 relative"> 
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <Input
                  type="text"
                  id="customerName"
                  value={customerNameInput} 
                  onChange={handleNameInputChange} 
                  placeholder="Digite o nome do cliente (mín. 3 letras)"
                  autoComplete="off" 
                />
                {isSearchingCustomers && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.cpf_cnpj}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSuggestionClick(suggestion)} 
                      >
                        {suggestion.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="md:col-span-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-6 justify-end">
              <Button 
                onClick={handleGenerateReport} 
                disabled={isLoadingReport || !selectedCpfCnpj || !startDate || !endDate}
                className="w-full md:w-auto flex items-center gap-2"
              >
                {isLoadingReport ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
              <Button 
                onClick={handleSendToN8N} 
                disabled={isSendingToWhatsApp || isLoadingReport || !selectedCpfCnpj || !startDate || !endDate}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {isSendingToWhatsApp ? 'Enviando...' : 'Enviar via WhatsApp'}
              </Button>
              {reportData.length > 0 && (
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  className="w-full md:w-auto flex items-center gap-2"
                  disabled={isLoadingReport || isSendingToWhatsApp} 
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card> { /* Fim do Card de Filtros */}

      {/* Seção de Exibição Condicional do Relatório */}
      {/* 1. Indicador de Loading */}
      {isLoadingReport && (
        <div className="text-center text-gray-500 mt-6">
          <p>Gerando relatório...</p>
        </div>
      )}

      {/* 2. Mensagem de Erro (se houver e não estiver carregando) */}
      {!isLoadingReport && error && (
        <div className="text-center text-red-600 mt-6 bg-red-100 p-4 rounded-md shadow">
          Erro ao gerar relatório: {error}
        </div>
      )}

      {/* 3. Mensagem de Nenhum Pedido Encontrado (apenas se busca tentada, sem loading, sem erro, sem dados) */}
      {!isLoadingReport && !error && searchAttempted && reportData.length === 0 && (
        <div className="text-center text-gray-500 mt-6 bg-white p-4 rounded-md shadow">
          Nenhum pedido encontrado para os critérios selecionados.
        </div>
      )}

      {/* 4. Exibição do Relatório (sem loading, sem erro, com dados) */}
      {!isLoadingReport && !error && reportData.length > 0 && (
        <div id="report-content" className="mt-6 bg-white p-6 rounded shadow-lg print:shadow-none print:p-0">
          {/* Cabeçalho de Impressão (visível apenas na impressão) */}
          <div className="print-header hidden print:block mb-6 text-center">
            <h2 className="text-xl font-bold">Relatório de Pedidos</h2>
            <p className="text-sm">Cliente: {customerNameInput}</p>
            {startDate && endDate && (
              <p className="text-sm">Período: {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}</p>
            )}
          </div>

          {/* Cabeçalho Visível na Tela + Botão Imprimir (oculto na impressão) */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h3 className="text-xl font-semibold text-gray-800">Relatório Gerado para: {customerNameInput}</h3>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>

          {/* Conteúdo do Relatório (Grupos Mensais) */}
          <div className="space-y-6">
            {reportData.map((monthData) => (
              <div key={monthData.monthYear} className="report-group border border-gray-200 rounded p-4" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">{monthData.monthYear}</h4>
                <div className="space-y-4">
                  {monthData.orders.map((order) => (
                    <div key={order.id} className="order-item pl-4 py-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Pedido #{order.id.substring(0, 8)}</span>
                        <span className="text-sm text-gray-500">{format(new Date(order.data_criacao), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <p className="text-md font-semibold text-gray-800 mb-2">Valor Total Pedido: {formatCurrency(order.valor_total)}</p>

                      {/* Lista de Itens */}
                      {order.itens && order.itens.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                          <h5 className="text-sm font-semibold mb-1 text-gray-600">Itens do Pedido:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 pl-4">
                            {order.itens.map((item: ReportOrderItemData) => (
                              <li key={item.id}>
                                <span className="font-medium">{item.produto?.nome || 'Produto não encontrado'}</span> -
                                Qtd: {item.quantidade} -
                                Peso: {item.peso_real?.toFixed(3) || 'N/A'} kg -
                                Valor: {formatCurrency(Number(item.valor_total) || 0)} { /* Convertido para número */}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div> { /* Fim de space-y-4 (ordens do mês) */}
                {/* Total Mensal */}
                <div className="text-right mt-4 font-semibold text-gray-800 border-t pt-2">
                  Total Mês: {formatCurrency(monthData.totalAmount)}
                </div>
              </div> /* Fim de report-group (mês) */
            ))}
          </div> { /* Fim de space-y-6 (grupos mensais) */}

          {/* Total Geral */}
          <div className="mt-6 pt-4 border-t-2 border-gray-400 text-right">
            <p className="text-lg font-bold text-gray-900">Total Geral do Período: {formatCurrency(totalGeral)}</p>
          </div>
        </div> /* Fim de #report-content */
      )}
      {/* Fim da Seção de Exibição Condicional */}
    </div> { /* Fim de space-y-6 (principal) */}
  </Layout>
);

};

export default CustomerOrdersReportPage;
