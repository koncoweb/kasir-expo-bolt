import { openDatabase, getCurrentTimestamp, SQLiteTransaction } from './database';
import { ProductService } from './productService';

export type Transaction = {
  id: string;
  total_amount: number;
  payment_amount: number;
  change_amount: number;
  created_at: number;
  items?: TransactionItem[];
};

export type TransactionItem = {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string; // Untuk tampilan
};

// Service untuk mengelola transaksi
export const TransactionService = {
  // Membuat transaksi baru
  create: (transaction: Omit<Transaction, 'id' | 'created_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'subtotal'>[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      const now = getCurrentTimestamp();
      const transactionId = Date.now().toString();

      // Memulai transaksi database
      db.transaction(
        (tx: SQLiteTransaction) => {
          // Menyimpan data transaksi
          tx.executeSql(
            'INSERT INTO transactions (id, total_amount, payment_amount, change_amount, created_at) VALUES (?, ?, ?, ?, ?);',
            [
              transactionId,
              transaction.total_amount,
              transaction.payment_amount,
              transaction.change_amount,
              now,
            ],
            (tx: SQLiteTransaction) => {},
            (tx: SQLiteTransaction, error: unknown): boolean => {
              console.error('Error creating transaction:', error);
              return false;
            }
          );

          // Menyimpan item transaksi dan memperbarui stok produk
          items.forEach((item) => {
            const itemId = `${transactionId}-${item.product_id}`;
            const subtotal = item.price * item.quantity;

            // Menyimpan item transaksi
            tx.executeSql(
              'INSERT INTO transaction_items (id, transaction_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?);',
              [itemId, transactionId, item.product_id, item.quantity, item.price, subtotal],
              () => {},
              (tx: SQLiteTransaction, error: unknown): boolean => {
                console.error('Error creating transaction item:', error);
                return false;
              }
            );

            // Memperbarui stok produk
            tx.executeSql(
              'UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?;',
              [item.quantity, now, item.product_id],
              () => {},
              (tx: SQLiteTransaction, error: unknown): boolean => {
                console.error('Error updating product stock:', error);
                return false;
              }
            );
          });
        },
        (tx: SQLiteTransaction, error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          resolve(transactionId);
        }
      );
    });
  },

  // Mendapatkan semua transaksi
  getAll: (): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'SELECT * FROM transactions ORDER BY created_at DESC;',
            [],
            (tx: SQLiteTransaction, { rows }: { rows: any }) => {
              const transactions: Transaction[] = [];
              for (let i = 0; i < rows.length; i++) {
                transactions.push(rows.item(i));
              }
              resolve(transactions);
            },
            (tx: SQLiteTransaction, error: unknown): boolean => {
              console.error('Error getting transactions:', error);
              reject(error);
              return false;
            }
          );
        },
        (tx: SQLiteTransaction, error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Mendapatkan transaksi berdasarkan ID dengan item-itemnya
  getById: (id: string): Promise<Transaction | null> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      let transaction: Transaction | null = null;

      db.transaction(
        (tx: SQLiteTransaction) => {
          // Mendapatkan data transaksi
          tx.executeSql(
            'SELECT * FROM transactions WHERE id = ?;',
            [id],
            (tx: SQLiteTransaction, { rows }: { rows: any }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }
              transaction = rows.item(0);
              if (transaction) {
                transaction.items = [];
              }

              // Mendapatkan item transaksi
              tx.executeSql(
                `SELECT ti.*, p.name as product_name 
                 FROM transaction_items ti 
                 LEFT JOIN products p ON ti.product_id = p.id 
                 WHERE ti.transaction_id = ?;`,
                [id],
                (_, { rows: itemRows }: { rows: { length: number; item: (index: number) => TransactionItem } }) => {
                  for (let i = 0; i < itemRows.length; i++) {
                    if (transaction && transaction.items) {
                      transaction.items.push(itemRows.item(i));
                    }
                  }
                  resolve(transaction);
                },
                (tx: SQLiteTransaction, error: unknown): boolean => {
                  console.error('Error getting transaction items:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (tx: SQLiteTransaction, error: unknown): boolean => {
              console.error('Error getting transaction summary:', error);
              reject(error);
              return false;
            }
          );
        },
        (tx: SQLiteTransaction, error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Mendapatkan laporan penjualan berdasarkan rentang tanggal
  getReport: (startDate: number, endDate: number): Promise<{ total: number; count: number; items: any[] }> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      
      db.transaction(
        (tx: SQLiteTransaction) => {
          // Mendapatkan total penjualan dan jumlah transaksi
          tx.executeSql(
            'SELECT SUM(total_amount) as total, COUNT(*) as count FROM transactions WHERE created_at BETWEEN ? AND ?;',
            [startDate, endDate],
            (tx: SQLiteTransaction, { rows }: { rows: any }) => {
              const summary = rows.item(0);
              
              // Mendapatkan item terlaris
              tx.executeSql(
                `SELECT ti.product_id, p.name as product_name, SUM(ti.quantity) as total_quantity, SUM(ti.subtotal) as total_sales 
                 FROM transaction_items ti 
                 LEFT JOIN products p ON ti.product_id = p.id 
                 LEFT JOIN transactions t ON ti.transaction_id = t.id 
                 WHERE t.created_at BETWEEN ? AND ? 
                 GROUP BY ti.product_id 
                 ORDER BY total_quantity DESC;`,
                [startDate, endDate],
                (_, { rows: itemRows }: { rows: { length: number; item: (index: number) => TransactionItem } }) => {
                  const items = [];
                  for (let i = 0; i < itemRows.length; i++) {
                    items.push(itemRows.item(i));
                  }
                  resolve({
                    total: summary.total || 0,
                    count: summary.count || 0,
                    items
                  });
                },
                (tx: SQLiteTransaction, error: unknown): boolean => {
                  console.error('Error getting sales report items:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (tx: SQLiteTransaction, error: unknown): boolean => {
              console.error('Error getting transaction summary:', error);
              reject(error);
              return false;
            }
          );
        },
        (tx: SQLiteTransaction, error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  }
};