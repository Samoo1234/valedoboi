import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Edit, Trash2, Search, UserPlus, Mail } from 'lucide-react';
import Layout from '../components/layout/Layout';

import MaskedInput from '../components/ui/MaskedInput';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  Customer, 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  searchCustomers
} from '../services/customerService';

type CustomerFormData = {
  cpf_cnpj: string;
  nome: string;
  email: string; 
  telefone: string;
  endereco: string;
};

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf'); // Padrão para CPF

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    control, // Adicionado control aqui
    formState: { errors, isSubmitting } 
  } = useForm<CustomerFormData>();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      // Determinar se é CPF ou CNPJ baseado no comprimento do valor existente ao editar
      const docLength = selectedCustomer.cpf_cnpj.replace(/\D/g, '').length;
      setDocumentType(docLength === 11 ? 'cpf' : 'cnpj');
      // O console.log e setValue já existentes continuarão a funcionar como antes

      setValue('cpf_cnpj', selectedCustomer.cpf_cnpj);
      setValue('nome', selectedCustomer.nome);
      setValue('email', selectedCustomer.email || '');
      setValue('telefone', selectedCustomer.telefone);
      setValue('endereco', selectedCustomer.endereco || '');
    } else {
      reset();
    }
  }, [selectedCustomer, setValue, reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        fetchCustomers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const results = await searchCustomers(searchQuery);
      setCustomers(results);
    } catch (error) {
      console.error('Error searching customers:', error);
      setError('Erro ao buscar clientes');
    } finally {
      setIsSearching(false);
    }
  };

  const openAddModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {

    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    reset();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.cpf_cnpj, data);
      } else {
        await createCustomer(data);
      }
      fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Erro ao salvar cliente');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete.cpf_cnpj);
      setCustomers(customers.filter(c => c.cpf_cnpj !== customerToDelete.cpf_cnpj));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Erro ao excluir cliente');
    }
  };

  return (
    <Layout title="Gerenciar Clientes">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar clientes por nome, CPF/CNPJ, email ou telefone..."
            className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openAddModal} Icon={UserPlus} className="sm:w-auto w-full">
          Adicionar Cliente
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {isLoading || isSearching ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            {searchQuery 
              ? `Nenhum cliente encontrado para "${searchQuery}".` 
              : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF/CNPJ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => {
                  return (
                    <tr key={customer.cpf_cnpj} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{customer.nome}</div>
                      </td>
                      {/* CPF/CNPJ Correto */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.cpf_cnpj}
                      </td>
                      {/* Email Correto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail size={16} className="mr-1" />
                          {customer.email || 'N/A'}
                        </div>
                      </td>
                      {/* Telefone */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {customer.telefone || 'N/A'}
                        </div>
                      </td>
                      {/* Endereço */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.endereco || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)} title="Editar Cliente">
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(customer)} title="Excluir Cliente">
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedCustomer ? `Editar Cliente: ${selectedCustomer.nome}` : "Adicionar Novo Cliente"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                className="form-checkbox h-5 w-5 text-primary-600"
                checked={documentType === 'cpf'}
                onChange={(e) => {
                  setDocumentType(e.target.checked ? 'cpf' : 'cnpj');
                  setValue('cpf_cnpj', ''); // Limpa o campo ao mudar o tipo
                }}
                disabled={!!selectedCustomer && false} // Habilita na edição
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">É CPF? (desmarcado para CNPJ)</span>
            </label>
          </div>
          <MaskedInput
            label="CPF/CNPJ"
            name="cpf_cnpj"
            control={control}
            mask={documentType === 'cpf' ? "999.999.999-99" : "99.999.999/9999-99"}
            placeholder={documentType === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"}
            fullWidth
            rules={{ required: 'CPF/CNPJ é obrigatório' }}
            error={errors.cpf_cnpj}
            readOnly={!!selectedCustomer && false} // Habilita na edição 
          />
          
          <Input
            label="Nome Completo"
            fullWidth
            {...register('nome', { 
              required: 'Nome é obrigatório', 
              minLength: { value: 3, message: 'Nome deve ter no mínimo 3 caracteres' },
              maxLength: { value: 100, message: 'Nome deve ter no máximo 100 caracteres' }
            })}
            error={errors.nome?.message}
          />
          
          <Input
            label="Email"
            type="email"
            fullWidth
            {...register('email', { 
              required: 'Email é obrigatório', 
              pattern: { 
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                message: 'Email inválido' 
              }
            })}
            error={errors.email?.message}
          />
          
          <MaskedInput
            label="Telefone"
            name="telefone"
            control={control}
            mask="+55 (99) 99999-9999"
            placeholder="+55 (XX) XXXXX-XXXX"
            fullWidth
            rules={{ required: 'Telefone é obrigatório' }}
            error={errors.telefone}
          />
          
          <div className="flex flex-col">
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              id="endereco"
              rows={3}
              className={`block w-full p-2.5 text-sm text-gray-900 border ${errors.endereco ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 shadow-sm`}
              {...register('endereco')}
            />
            {errors.endereco && <span className="text-red-500 text-xs">{errors.endereco.message}</span>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              {selectedCustomer ? 'Salvar Alterações' : 'Adicionar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        <p>Tem certeza que deseja excluir o cliente "{customerToDelete?.nome}"?</p>
        <div className="flex justify-end space-x-3 mt-4">
          <Button type="button" variant="outline" onClick={closeDeleteModal}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDeleteCustomer}>
            Excluir
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminCustomers;