import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Printer } from 'lucide-react-native';

import { Product, ProductService } from '../../database/productService';
import { TransactionService } from '../../database/transactionService';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CashierScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load products from database
  useEffect(() => {
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
  }, []);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) < totalAmount) {
      return;
    }
    
    setLoading(true);
    
    // Simpan transaksi ke database
    TransactionService.create(
      {
        total_amount: totalAmount,
        payment_amount: parseFloat(paymentAmount),
        change_amount: change,
      },
      cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))
    )
      .then(() => {
        setLoading(false);
        setShowReceipt(true);
      })
      .catch((error) => {
        console.error('Error saving transaction:', error);
        setLoading(false);
        alert('Gagal menyimpan transaksi');
      });
  };

  const change = paymentAmount ? parseFloat(paymentAmount) - totalAmount : 0;

  const resetTransaction = () => {
    setCart([]);
    setPaymentAmount('');
    setShowPaymentModal(false);
    setShowReceipt(false);
  };

  const Receipt = () => (
    <View style={styles.receiptContainer}>
      <Text style={styles.receiptHeader}>Toko Sejahtera</Text>
      <Text style={styles.receiptSubheader}>Struk Pembayaran</Text>
      <Text style={styles.receiptDate}>{new Date().toLocaleString()}</Text>
      
      <View style={styles.receiptDivider} />
      
      {cart.map((item) => (
        <View key={item.id} style={styles.receiptItem}>
          <Text style={styles.receiptItemName}>
            {item.name} x {item.quantity}
          </Text>
          <Text style={styles.receiptItemPrice}>
            Rp {(item.price * item.quantity).toLocaleString()}
          </Text>
        </View>
      ))}
      
      <View style={styles.receiptDivider} />
      
      <View style={styles.receiptTotal}>
        <Text style={styles.receiptTotalLabel}>Total</Text>
        <Text style={styles.receiptTotalAmount}>Rp {totalAmount.toLocaleString()}</Text>
      </View>
      
      <View style={styles.receiptPayment}>
        <Text style={styles.receiptPaymentLabel}>Tunai</Text>
        <Text style={styles.receiptPaymentAmount}>
          Rp {parseFloat(paymentAmount).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.receiptChange}>
        <Text style={styles.receiptChangeLabel}>Kembalian</Text>
        <Text style={styles.receiptChangeAmount}>Rp {change.toLocaleString()}</Text>
      </View>
      
      <View style={styles.receiptFooter}>
        <Text style={styles.receiptThankYou}>Terima Kasih</Text>
        <Text style={styles.receiptFooterText}>Selamat Berbelanja Kembali</Text>
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.productsContainer}>
        <Text style={styles.sectionTitle}>Produk</Text>
        <FlatList
          data={filteredProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => addToCart(item)}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>Rp {item.price.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      <View style={styles.cartContainer}>
        <Text style={styles.sectionTitle}>Keranjang</Text>
        <FlatList
          data={cart}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>
                  Rp {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, -1)}
                  style={styles.quantityButton}>
                  <Minus size={20} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, 1)}
                  style={styles.quantityButton}>
                  <Plus size={20} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, -item.quantity)}
                  style={[styles.quantityButton, styles.deleteButton]}>
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total:</Text>
        <Text style={styles.totalAmount}>Rp {totalAmount.toLocaleString()}</Text>
        <TouchableOpacity
          style={[styles.checkoutButton, { opacity: cart.length > 0 ? 1 : 0.5 }]}
          disabled={cart.length === 0}
          onPress={() => setShowPaymentModal(true)}>
          <Text style={styles.checkoutButtonText}>Bayar</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPaymentModal && !showReceipt}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pembayaran</Text>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Total Belanja</Text>
              <Text style={styles.modalTotal}>Rp {totalAmount.toLocaleString()}</Text>
              
              <Text style={styles.modalLabel}>Jumlah Pembayaran</Text>
              <TextInput
                style={styles.paymentInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Masukkan jumlah pembayaran"
              />
              
              {paymentAmount && (
                <>
                  <Text style={styles.modalLabel}>Kembalian</Text>
                  <Text style={[
                    styles.modalChange,
                    { color: change >= 0 ? '#059669' : '#dc2626' }
                  ]}>
                    Rp {change.toLocaleString()}
                  </Text>
                </>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalCancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  { opacity: !paymentAmount || parseFloat(paymentAmount) < totalAmount ? 0.5 : 1 }
                ]}
                disabled={!paymentAmount || parseFloat(paymentAmount) < totalAmount}
                onPress={handlePayment}>
                <Text style={styles.modalConfirmButtonText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReceipt}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Receipt />
            
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.printButton}
                onPress={() => {
                  // Here you would implement actual printing logic
                  console.log('Printing receipt...');
                }}>
                <Printer size={20} color="#ffffff" />
                <Text style={styles.printButtonText}>Cetak Struk</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.newTransactionButton}
                onPress={resetTransaction}>
                <Text style={styles.newTransactionButtonText}>Transaksi Baru</Text>
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    color: '#1f2937',
  },
  productsContainer: {
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
    color: '#1f2937',
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  cartContainer: {
    flex: 1,
    marginBottom: 16,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  cartItemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  totalContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#3b82f6',
  },
  checkoutButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  modalTotal: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  modalChange: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  receiptContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 8,
  },
  receiptHeader: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptSubheader: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptItemName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1f2937',
  },
  receiptItemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  receiptTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  receiptTotalAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1f2937',
  },
  receiptPayment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptPaymentLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  receiptPaymentAmount: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#6b7280',
  },
  receiptChange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  receiptChangeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  receiptChangeAmount: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#059669',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  receiptThankYou: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  receiptFooterText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  receiptActions: {
    marginTop: 24,
    gap: 12,
  },
  printButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  newTransactionButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  newTransactionButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});