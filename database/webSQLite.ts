// Web SQLite implementation using sql.js
import initSqlJs, { Database } from 'sql.js';

// Interface to match the SQLite transaction interface
export interface WebSQLiteTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: WebSQLiteTransaction, resultSet: any) => void,
    errorCallback?: (transaction: WebSQLiteTransaction, error: any) => boolean
  ) => void;
}

// Interface for transaction callbacks
export interface TransactionCallback {
  (tx: WebSQLiteTransaction): void;
}

export interface ErrorCallback {
  (error: any): void;
}

export interface SuccessCallback {
  (): void;
}

// Class to handle SQLite operations for web
export class WebSQLiteDatabase {
  private db: Database | null = null;
  private dbName: string;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      // Initialize sql.js
      const SQL = await initSqlJs({
        // Use a relative path for the WASM file
        // This will look for the file in the public directory when served
        locateFile: (file: string) => `/sql.js/${file}`
      });
      
      // Create a new database
      this.db = new SQL.Database();
      
      // Try to load existing data from localStorage
      const savedData = localStorage.getItem(`sqlitedb_${this.dbName}`);
      if (savedData) {
        try {
          const dataArray = new Uint8Array(JSON.parse(savedData));
          this.db = new SQL.Database(dataArray);
        } catch (e) {
          console.error('Error loading database from localStorage:', e);
          // Continue with a new database if loading fails
          this.db = new SQL.Database();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize sql.js:', error);
      throw error;
    }
  }

  // Save the database to localStorage
  private saveToLocalStorage() {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const arr = Array.from(data);
      localStorage.setItem(`sqlitedb_${this.dbName}`, JSON.stringify(arr));
    } catch (e) {
      console.error('Error saving database to localStorage:', e);
    }
  }

  // Execute a transaction
  public async transaction(
    callback: TransactionCallback,
    errorCallback?: ErrorCallback,
    successCallback?: SuccessCallback
  ): Promise<void> {
    // Wait for initialization if not already done
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
    
    if (!this.db) {
      if (errorCallback) {
        errorCallback(new Error('Database not initialized'));
      }
      return;
    }

    try {
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION;');
      
      // Create a transaction object
      const tx: WebSQLiteTransaction = {
        executeSql: (sqlStatement, args = [], callback, errorCallback) => {
          try {
            if (!this.db) throw new Error('Database not initialized');
            
            // Replace ? placeholders with bound parameters
            const statement = this.db.prepare(sqlStatement);
            
            if (args && args.length > 0) {
              statement.bind(args);
            }
            
            // Execute the statement and collect results
            const rows: any[] = [];
            while (statement.step()) {
              rows.push(statement.getAsObject());
            }
            
            // Create a result set similar to what WebSQL would return
            const resultSet = {
              rows: {
                length: rows.length,
                item: (i: number) => rows[i],
                _array: rows
              },
              rowsAffected: this.db.getRowsModified()
            };
            
            // Call the success callback if provided
            if (callback) {
              callback(tx, resultSet);
            }
            
            // Clean up
            statement.free();
          } catch (error) {
            console.error('SQL Error:', error, 'in statement:', sqlStatement);
            if (errorCallback) {
              errorCallback(tx, error);
            }
          }
        }
      };
      
      // Execute the transaction callback
      callback(tx);
      
      // Commit the transaction
      this.db.exec('COMMIT;');
      
      // Save changes to localStorage
      this.saveToLocalStorage();
      
      // Call success callback if provided
      if (successCallback) {
        successCallback();
      }
    } catch (error) {
      // Rollback on error
      if (this.db) {
        try {
          this.db.exec('ROLLBACK;');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      
      // Call error callback if provided
      if (errorCallback) {
        errorCallback(error);
      }
    }
  }

  // Close the database and clean up resources
  public close(): void {
    if (this.db) {
      this.saveToLocalStorage();
      this.db.close();
      this.db = null;
    }
  }
}

// Factory function to create a database instance
export function openWebDatabase(name: string): WebSQLiteDatabase {
  return new WebSQLiteDatabase(name);
}