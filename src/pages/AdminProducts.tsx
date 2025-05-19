import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  Product, 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../services/productService';
import { formatCurrency } from '../utils/formatters';

type ProductFormData = {
  nome: string;
  preco_kg: number;
  descricao: string;
  disponivel: boolean;
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm<ProductFormData>();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setValue('nome', selectedProduct.nome);
      setValue('preco_kg', selectedProduct.preco_kg);
      setValue('descricao', selectedProduct.descricao || '');
      setValue('disponivel', selectedProduct.disponivel ?? true);
    } else {
      reset({ nome: '', preco_kg: 0, descricao: '', disponivel: true });
    }
  }, [selectedProduct, setValue, reset]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    reset();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, data);
      } else {
        await createProduct(data);
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error); // Mantido um log de erro genérico
      setError('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Erro ao excluir produto');
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(product => 
        product.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.descricao?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <Layout title="Gerenciar Produtos">
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="pl-10 block w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openAddModal} Icon={Plus}>
          Adicionar Produto
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{product.nome}</h3>
                    <p className="text-xl font-bold text-primary mt-1">
                      {formatCurrency(product.preco_kg)}/kg
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {product.descricao || 'Sem descrição'}
                    </p>
                    <p className="text-sm mt-2">
                      Status: <span className={`font-medium ${product.disponivel ? 'text-green-600' : 'text-red-600'}`}>
                        {product.disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(product)}
                      Icon={Edit}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => openDeleteModal(product)}
                      Icon={Trash2}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedProduct ? `Editar Produto: ${selectedProduct.nome}` : 'Adicionar Produto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome do Produto"
            fullWidth
            {...register('nome', { required: 'Nome é obrigatório' })}
            error={errors.nome?.message}
          />
          
          <Input
            label="Preço por kg (R$)"
            type="number"
            step="0.01"
            fullWidth
            {...register('preco_kg', { 
              required: 'Preço é obrigatório',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Preço deve ser maior que zero' }
            })}
            error={errors.preco_kg?.message}
          />
          
          <div>
            <label htmlFor="disponivel" className="inline-flex items-center">
              <input
                id="disponivel"
                type="checkbox"
                className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                {...register('disponivel')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Disponível</span>
            </label>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              {...register('descricao')}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedProduct ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão de Produto"
        size="sm"
      >
        <div className="space-y-4">
          <p>
            Tem certeza que deseja excluir o produto <strong>{productToDelete?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeDeleteModal}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={handleDeleteProduct}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminProducts;