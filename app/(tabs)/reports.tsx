import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowUp, ArrowDown, Package, ShoppingCart } from 'lucide-react-native';

export default function ReportsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Pendapatan Hari Ini</Text>
            <ArrowUp size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>Rp 1.250.000</Text>
          <Text style={styles.statChange}>+15% dari kemarin</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Transaksi Hari Ini</Text>
            <ShoppingCart size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>48</Text>
          <Text style={styles.statChange}>+5 dari kemarin</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Stok Menipis</Text>
            <Package size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statChange}>Produk perlu restock</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Produk Terjual</Text>
            <ArrowDown size={24} color="#ef4444" />
          </View>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statChange}>items hari ini</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produk Terlaris</Text>
        {[
          { name: 'Mie Instan', sold: 45, revenue: 157500 },
          { name: 'Sabun Mandi', sold: 28, revenue: 126000 },
          { name: 'Shampo Sachet', sold: 52, revenue: 78000 },
        ].map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.productStats}>
              <Text style={styles.productSold}>{product.sold} terjual</Text>
              <Text style={styles.productRevenue}>
                Rp {product.revenue.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productSold: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  productRevenue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#3b82f6',
  },
});