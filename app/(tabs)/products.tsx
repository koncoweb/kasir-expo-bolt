import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, X } from 'lucide-react-native';

import { Product, ProductService } from '../../database/productService';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
  });
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load products from database
  const loadProducts = () => {
    setLoading(true);
    ProductService.getAll()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading products:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Semua field harus diisi');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock, 10);

    if (isNaN(price) || price <= 0) {
      setError('Harga harus lebih dari 0');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setError('Stok tidak boleh negatif');
      return;
    }

    setLoading(true);
    ProductService.create({
      name: formData.name,
      price: price,
      stock: stock,
    })
      .then(() => {
        loadProducts();
        resetForm();
        setShowAddModal(false);
      })
      .catch((error) => {
        console.error('Error creating product:', error);
        setError('Gagal menambahkan produk');
        setLoading(false);
      });
  };

  const handleEditProduct = () => {
    if (!selectedProduct) return;

    if (!formData.name || !formData.price || !formData.stock) {
      setError('Semua field harus diisi');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock, 10);

    if (isNaN(price) || price <= 0) {
      setError('Harga harus lebih dari 0');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setError('Stok tidak boleh negatif');
      return;
    }

    setLoading(true);
    ProductService.update(selectedProduct.id, {
      name: formData.name,
      price: price,
      stock: stock,
    })
      .then(() => {
        loadProducts();
        resetForm();
        setShowEditModal(false);
      })
      .catch((error) => {
        console.error('Error updating product:', error);
        setError('Gagal memperbarui produk');
        setLoading(false);
      });
  };

  const handleDeleteProduct = (id: string) => {
    setLoading(true);
    ProductService.delete(id)
      .then(() => {
        loadProducts();
      })
      .catch((error) => {
        console.error('Error deleting product:', error);
        alert('Gagal menghapus produk. ' + error.message);
        setLoading(false);
      });
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', stock: '' });
    setSelectedProduct(null);
    setError(null);
  };

  const ProductForm = () => (
    <View style={styles.formContainer}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Produk</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Masukkan nama produk"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Harga</Text>
        <TextInput
          style={styles.input}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          placeholder="Masukkan harga"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Stok</Text>
        <TextInput
          style={styles.input}
          value={formData.stock}
          onChangeText={(text) => setFormData({ ...formData, stock: text })}
          placeholder="Masukkan jumlah stok"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>Rp {item.price.toLocaleString()}</Text>
              <Text style={[
                styles.productStock,
                { color: item.stock < 10 ? '#dc2626' : '#6b7280' }
              ]}>
                Stok: {item.stock}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditModal(item)}>
                <Edit size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteProduct(item.id)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Produk</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ProductForm />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddProduct}>
                <Text style={styles.confirmButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Produk</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowEditModal(false);
                }}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ProductForm />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setShowEditModal(false);
                }}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleEditProduct}>
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Inter_400Regular',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});