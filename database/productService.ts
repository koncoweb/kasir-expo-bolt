import { openDatabase, getCurrentTimestamp, SQLiteTransaction } from './database';

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  created_at: number;
  updated_at: number;
};

// Service untuk mengelola produk
export const ProductService = {
  // Mendapatkan semua produk
  getAll: (): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'SELECT * FROM products ORDER BY name ASC;',
            [],
            (_, { rows }: { rows: any }) => {
              const products: Product[] = [];
              for (let i = 0; i < rows.length; i++) {
                products.push(rows.item(i));
              }
              resolve(products);
            },
            (_, error): boolean => {
              console.error('Error getting products:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Mendapatkan produk berdasarkan ID
  getById: (id: string): Promise<Product | null> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'SELECT * FROM products WHERE id = ?;',
            [id],
            (_, { rows }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }
              resolve(rows.item(0));
            },
            (_, error): boolean => {
              console.error('Error getting product by id:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Mencari produk berdasarkan nama
  search: (query: string): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC;',
            [`%${query}%`],
            (_, { rows }) => {
              const products: Product[] = [];
              for (let i = 0; i < rows.length; i++) {
                products.push(rows.item(i));
              }
              resolve(products);
            },
            (_, error): boolean => {
              console.error('Error searching products:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Membuat produk baru
  create: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      const now = getCurrentTimestamp();
      const id = Date.now().toString();

      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'INSERT INTO products (id, name, price, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
            [id, product.name, product.price, product.stock, now, now],
            () => {
              resolve(id);
            },
            (_, error): boolean => {
              console.error('Error creating product:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Memperbarui produk
  update: (id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      const now = getCurrentTimestamp();
      const updates: string[] = [];
      const values: any[] = [];

      // Membuat query dinamis berdasarkan field yang diperbarui
      if (product.name !== undefined) {
        updates.push('name = ?');
        values.push(product.name);
      }
      if (product.price !== undefined) {
        updates.push('price = ?');
        values.push(product.price);
      }
      if (product.stock !== undefined) {
        updates.push('stock = ?');
        values.push(product.stock);
      }

      // Menambahkan updated_at dan id ke values
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      if (updates.length === 0) {
        resolve();
        return;
      }

      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?;`,
            values,
            () => {
              resolve();
            },
            (_, error): boolean => {
              console.error('Error updating product:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Menghapus produk
  delete: (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();

      db.transaction(
        (tx: SQLiteTransaction) => {
          // Memeriksa apakah produk digunakan dalam transaksi
          tx.executeSql(
            'SELECT COUNT(*) as count FROM transaction_items WHERE product_id = ?;',
            [id],
            (_, { rows }) => {
              const count = rows.item(0).count;
              if (count > 0) {
                reject(new Error('Produk tidak dapat dihapus karena sudah digunakan dalam transaksi'));
                return;
              }

              // Jika tidak digunakan, hapus produk
              tx.executeSql(
                'DELETE FROM products WHERE id = ?;',
                [id],
                () => {
                  resolve();
                },
                (_, error): boolean => {
                  console.error('Error deleting product:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (_, error): boolean => {
              console.error('Error checking product usage:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },

  // Memperbarui stok produk
  updateStock: (id: string, change: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
      const now = getCurrentTimestamp();

      db.transaction(
        (tx: SQLiteTransaction) => {
          tx.executeSql(
            'UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?;',
            [change, now, id],
            () => {
              resolve();
            },
            (_, error): boolean => {
              console.error('Error updating product stock:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: unknown) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },
};