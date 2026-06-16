const path = require('path');

const usePostgres = !!process.env.DATABASE_URL;

let dbWrapper = {};

if (usePostgres) {
  const { Pool } = require('pg');
  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const initQuery = `
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      topic TEXT,
      checklist_data TEXT,
      plant TEXT,
      unit TEXT,
      line_no TEXT,
      piping_class TEXT,
      rcr_standard TEXT,
      drawing_no TEXT,
      material TEXT,
      p_no TEXT,
      thickness TEXT,
      rating TEXT,
      production TEXT,
      services TEXT,
      nde_rt TEXT,
      nde_ut TEXT,
      nde_mpi TEXT,
      nde_dpi TEXT,
      nde_ht TEXT,
      nde_pmi TEXT,
      pwht TEXT,
      pwht_comment TEXT,
      design_temp TEXT,
      design_pressure TEXT,
      test_pressure TEXT,
      insulation TEXT,
      coating_method TEXT,
      paint_code TEXT,
      wps_document TEXT,
      repair_method TEXT,
      inspection_engineer TEXT,
      date TEXT,
      status TEXT DEFAULT 'Pending',
      approver_name TEXT,
      approved_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  pool.query(initQuery, (err) => {
    if (err) console.error('Error creating requests table:', err.message);
    else console.log('Requests table initialized in PostgreSQL.');
  });

  // Convert ? to $1, $2, etc.
  const convertSql = (sql) => {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
  };

  dbWrapper.queryAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      pool.query(convertSql(sql), params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows);
      });
    });
  };

  dbWrapper.queryGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      pool.query(convertSql(sql), params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows[0]);
      });
    });
  };

  dbWrapper.queryRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const pgSql = convertSql(sql);
      pool.query(pgSql, params, (err, res) => {
        if (err) reject(err);
        else {
          resolve({ lastID: res.rows[0]?.id, changes: res.rowCount });
        }
      });
    });
  };

} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database.');
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          topic TEXT,
          checklist_data TEXT,
          plant TEXT,
          unit TEXT,
          line_no TEXT,
          piping_class TEXT,
          rcr_standard TEXT,
          drawing_no TEXT,
          material TEXT,
          p_no TEXT,
          thickness TEXT,
          rating TEXT,
          production TEXT,
          services TEXT,
          nde_rt TEXT,
          nde_ut TEXT,
          nde_mpi TEXT,
          nde_dpi TEXT,
          nde_ht TEXT,
          nde_pmi TEXT,
          pwht TEXT,
          pwht_comment TEXT,
          design_temp TEXT,
          design_pressure TEXT,
          test_pressure TEXT,
          insulation TEXT,
          coating_method TEXT,
          paint_code TEXT,
          wps_document TEXT,
          repair_method TEXT,
          inspection_engineer TEXT,
          date TEXT,
          status TEXT DEFAULT 'Pending',
          approver_name TEXT,
          approved_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) console.error('Error creating requests table:', err.message);
          else console.log('Requests table initialized in SQLite.');
        });
      });
    }
  });

  dbWrapper.queryAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  dbWrapper.queryGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  dbWrapper.queryRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };
}

dbWrapper.isPostgres = usePostgres;
module.exports = dbWrapper;
