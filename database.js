const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'payment_events.db');
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS payment_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT UNIQUE NOT NULL,
          event_type TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          received_at TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_payment_id ON payment_events(payment_id);
        CREATE INDEX IF NOT EXISTS idx_event_id ON payment_events(event_id);
        CREATE INDEX IF NOT EXISTS idx_received_at ON payment_events(received_at);
      `;

      this.db.exec(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  async storeEvent(eventData) {
    return new Promise((resolve, reject) => {
      const { event_id, event_type, payment_id, payload, received_at } = eventData;
      
      const insertSQL = `
        INSERT INTO payment_events (event_id, event_type, payment_id, payload, received_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(insertSQL, [event_id, event_type, payment_id, payload, received_at], function(err) {
        if (err) {
          console.error('Error storing event:', err);
          reject(err);
        } else {
          console.log(`Event stored with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async getEventById(eventId) {
    return new Promise((resolve, reject) => {
      const selectSQL = `
        SELECT * FROM payment_events WHERE event_id = ?
      `;

      this.db.get(selectSQL, [eventId], (err, row) => {
        if (err) {
          console.error('Error fetching event by ID:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getEventsByPaymentId(paymentId) {
    return new Promise((resolve, reject) => {
      const selectSQL = `
        SELECT event_type, received_at, payload, event_id
        FROM payment_events 
        WHERE payment_id = ? 
        ORDER BY received_at ASC
      `;

      this.db.all(selectSQL, [paymentId], (err, rows) => {
        if (err) {
          console.error('Error fetching events by payment ID:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database;
