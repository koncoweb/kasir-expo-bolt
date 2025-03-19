import { Platform } from 'react-native';
import { openWebDatabase } from './webSQLite';

// Only import SQLite for non-web platforms
let SQLite: any;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// Define SQLite transaction interface
export interface SQLiteTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLiteTransaction, resultSet: any) => void,
    errorCallback?: (transaction: SQLiteTransaction, error: any) => boolean
  ) => void;
}

// Define transaction callback interfaces
interface TransactionCallback {
  (tx: SQLiteTransaction): void;
}

interface ErrorCallback {
  (error: any): void;
}

interface SuccessCallback {
  (): void;
}

// Fungsi untuk membuka database
export function openDatabase() {
  if (Platform.OS === 'web') {
    // Menggunakan implementasi SQLite untuk web
    return openWebDatabase('kasir.db');
  }

  const db = SQLite.openDatabaseSync('kasir.db');
  
  // Menambahkan method transaction yang kompatibel dengan kode yang ada
  return {
    ...db,
    transaction: (callback: TransactionCallback, errorCallback?: ErrorCallback, successCallback?: SuccessCallback) => {
      db.withTransactionSync(() => {
        callback({
          executeSql: (sqlStatement, args, callback, errorCallback) => {
            try {
              const statement = db.prepareSync(sqlStatement);
              const result = statement.executeSync(args || []);
              if (callback) {
                callback({ executeSql: () => {} }, result);
              }
              statement.finalizeSync();
            } catch (error) {
              if (errorCallback) {
                errorCallback({ executeSql: () => {} }, error);
              } else {
                console.error('SQL Error:', error);
              }
            }
          }
        });
      });
      
      if (successCallback) {
        successCallback();
      }
    }
  };
}

// Inisialisasi database
export function initDatabase() {
  const db = openDatabase();
  
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: SQLiteTransaction) => {
        // Tabel Produk
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating products table:', error);
            return false;
          }
        );

        // Tabel Transaksi
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY NOT NULL,
            total_amount REAL NOT NULL,
            payment_amount REAL NOT NULL,
            change_amount REAL NOT NULL,
            created_at INTEGER NOT NULL
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating transactions table:', error);
            return false;
          }
        );

        // Tabel Item Transaksi
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transaction_items (
            id TEXT PRIMARY KEY NOT NULL,
            transaction_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating transaction_items table:', error);
            return false;
          }
        );

        // Tabel Pengaturan
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );`,
          [],
          () => {},
          (_, error): boolean => {
            console.error('Error creating settings table:', error);
            return false;
          }
        );

        // Inisialisasi pengaturan default
        tx.executeSql(
          `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);`,
          ['store_name', 'Toko Sejahtera'],
          () => {},
          (_, error): boolean => {
            console.error('Error inserting default store name:', error);
            return false;
          }
        );
      },
      (error: unknown) => {
        console.error('Database transaction error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
}

// Fungsi untuk mendapatkan timestamp saat ini
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}