import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Add it to a .env file or environment variables.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const numericFields = {
  employees: ['basic_salary', 'allowances'],
  payroll_records: ['basic_salary', 'allowances', 'overtime', 'bonus', 'gross_salary', 'paye', 'nssf', 'nhif', 'pension', 'other_deductions', 'total_deductions', 'net_salary'],
  attendance: ['hours'],
  payslips: ['gross_pay', 'net_pay'],
};

const normalizeEmployee = (employee) => {
  const { password, ...rest } = employee;
  return rest;
};

const normalizeNumbers = (row, fields = []) => {
  fields.forEach((field) => {
    if (row[field] != null) {
      const parsed = Number(row[field]);
      row[field] = Number.isNaN(parsed) ? row[field] : parsed;
    }
  });
  return row;
};

const getNextId = async (prefix, table) => {
  const result = await pool.query(`SELECT id FROM ${table} WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`, [`${prefix}%`]);
  if (!result.rows.length) {
    return `${prefix}0001`;
  }
  const maxId = Number(result.rows[0].id.replace(/[^0-9]/g, ''));
  return `${prefix}${String(Number.isFinite(maxId) ? maxId + 1 : 1).padStart(4, '0')}`;
};

const buildUpdateQuery = (table, changes, idField, idValue) => {
  const fields = Object.keys(changes);
  const values = Object.values(changes);
  if (!fields.length) {
    return null;
  }
  const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  return {
    text: `UPDATE ${table} SET ${setClause} WHERE ${idField} = $${fields.length + 1} RETURNING *`,
    values: [...values, idValue],
  };
};

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id text PRIMARY KEY,
        name text NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        role text NOT NULL,
        id_number text,
        department text,
        position text,
        basic_salary numeric,
        allowances numeric,
        bank_name text,
        bank_account text,
        status text,
        join_date date,
        avatar text,
        created_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payroll_records (
        id text PRIMARY KEY,
        employee_id text REFERENCES employees(id) ON DELETE CASCADE,
        month text,
        basic_salary numeric,
        allowances numeric,
        overtime numeric,
        bonus numeric,
        gross_salary numeric,
        paye numeric,
        nssf numeric,
        nhif numeric,
        pension numeric,
        other_deductions numeric,
        total_deductions numeric,
        net_salary numeric,
        status text,
        payment_date date,
        created_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id text PRIMARY KEY,
        employee_id text REFERENCES employees(id) ON DELETE CASCADE,
        type text,
        start_date date,
        end_date date,
        days integer,
        reason text,
        status text,
        created_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id text PRIMARY KEY,
        employee_id text REFERENCES employees(id) ON DELETE CASCADE,
        date date,
        check_in text,
        check_out text,
        hours numeric,
        status text
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        action text,
        user_name text,
        entity_type text,
        entity_id text,
        log_type text DEFAULT 'info',
        created_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payslips (
        id text PRIMARY KEY,
        employee_id text REFERENCES employees(id) ON DELETE CASCADE,
        period text,
        gross_pay numeric,
        net_pay numeric,
        created_at timestamptz NOT NULL DEFAULT NOW()
      );
    `);

    const employeesCount = await client.query('SELECT 1 FROM employees LIMIT 1');
    if (!employeesCount.rows.length) {
      await client.query(`
        INSERT INTO employees (id, name, email, password, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16),
          ($17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32),
          ($33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52)
      `, [
        'EMP0001', 'Alice Johnson', 'admin@example.com', 'password123', 'Admin', 'A1234567', 'Finance', 'Payroll Manager', 70000, 12000, 'Equity Bank', '1234567890', 'Active', '2023-01-15', 'https://i.pravatar.cc/150?img=12', new Date().toISOString(),
        'EMP0002', 'Marcus Reed', 'hr@example.com', 'password123', 'HR', 'B2345678', 'Human Resources', 'HR Specialist', 54000, 8000, 'KCB Bank', '2345678901', 'Active', '2024-03-21', 'https://i.pravatar.cc/150?img=34', new Date().toISOString(),
        'EMP0003', 'Tina Patel', 'employee@example.com', 'password123', 'Employee', 'C3456789', 'Accounting', 'Senior Accountant', 65000, 9000, 'Stanbic Bank', '3456789012', 'On Leave', '2022-05-09', 'https://i.pravatar.cc/150?img=56', new Date().toISOString(),
      ]);

      await client.query(`
        INSERT INTO payroll_records (id, employee_id, month, basic_salary, allowances, overtime, bonus, gross_salary, paye, nssf, nhif, pension, other_deductions, total_deductions, net_salary, status, payment_date, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      `, ['PAY-EMP0003-001', 'EMP0003', '2026-05', 65000, 9000, 1200, 500, 75700, 9084, 2271, 1700, 1514, 650, 13519, 62181, 'Paid', '2026-05-28', new Date().toISOString()]);

      await client.query(`
        INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, ['LV-EMP0003-001', 'EMP0003', 'Annual Leave', '2026-06-01', '2026-06-10', 8, 'Family travel', 'Pending', new Date().toISOString()]);

      await client.query(`
        INSERT INTO attendance (id, employee_id, date, check_in, check_out, hours, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, ['AT-EMP0003-001', 'EMP0003', '2026-05-20', '08:10', '17:00', 8, 'Present']);

      await client.query(`
        INSERT INTO audit_logs (action, user_name, entity_type, entity_id, log_type, created_at)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, ['System initialized', 'System', 'system', null, 'info', new Date().toISOString()]);
    }
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Payroll Salary System backend is running.' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM employees WHERE email = $1 AND password = $2 LIMIT 1',
      [email, password]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.json({ data: normalizeEmployee(result.rows[0]) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at FROM employees ORDER BY name'
    );
    res.json({ data: result.rows.map((row) => normalizeNumbers(row, numericFields.employees)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch employees.' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at FROM employees WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json({ data: normalizeNumbers(result.rows[0], numericFields.employees) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch employee.' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, email, password, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar } = req.body;
    const id = await getNextId('EMP', 'employees');
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO employees (id, name, email, password, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at`,
      [id, name, email, password, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, createdAt]
    );

    res.status(201).json({ data: normalizeNumbers(result.rows[0], numericFields.employees) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create employee.' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const changes = { ...req.body };
    delete changes.id;

    const query = buildUpdateQuery('employees', changes, 'id', req.params.id);
    if (!query) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    const result = await pool.query(query);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json({ data: normalizeNumbers(result.rows[0], numericFields.employees) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update employee.' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    res.json({ data: normalizeNumbers(result.rows[0], numericFields.employees) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete employee.' });
  }
});

app.get('/api/payroll', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payroll_records ORDER BY created_at DESC');
    res.json({ data: result.rows.map((row) => normalizeNumbers(row, numericFields.payroll_records)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch payroll records.' });
  }
});

app.post('/api/payroll-records', async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const records = [];

    for (const record of payload) {
      const id = record.id || `PAY-${record.employee_id}-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const result = await pool.query(
        `INSERT INTO payroll_records (id, employee_id, month, basic_salary, allowances, overtime, bonus, gross_salary, paye, nssf, nhif, pension, other_deductions, total_deductions, net_salary, status, payment_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          id,
          record.employee_id,
          record.month,
          record.basic_salary,
          record.allowances,
          record.overtime,
          record.bonus,
          record.gross_salary,
          record.paye,
          record.nssf,
          record.nhif,
          record.pension,
          record.other_deductions,
          record.total_deductions,
          record.net_salary,
          record.status,
          record.payment_date,
          createdAt,
        ]
      );
      records.push(normalizeNumbers(result.rows[0], numericFields.payroll_records));
    }

    res.status(201).json({ data: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create payroll records.' });
  }
});

app.put('/api/payroll-records/:id', async (req, res) => {
  try {
    const changes = { ...req.body };
    delete changes.id;

    const query = buildUpdateQuery('payroll_records', changes, 'id', req.params.id);
    if (!query) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    const result = await pool.query(query);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }

    res.json({ data: normalizeNumbers(result.rows[0], numericFields.payroll_records) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update payroll record.' });
  }
});

app.get('/api/leave-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch leave requests.' });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const payload = req.body;
    const id = `LV-${payload.employee_id}-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const result = await pool.query(
      `INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [id, payload.employee_id, payload.type, payload.start_date, payload.end_date, payload.days, payload.reason, payload.status, createdAt]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create leave request.' });
  }
});

app.put('/api/leave-requests/:id', async (req, res) => {
  try {
    const query = buildUpdateQuery('leave_requests', req.body, 'id', req.params.id);
    if (!query) {
      return res.status(400).json({ error: 'No changes provided.' });
    }
    const result = await pool.query(query);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update leave request.' });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance ORDER BY date DESC');
    res.json({ data: result.rows.map((row) => normalizeNumbers(row, numericFields.attendance)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch attendance.' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const payload = req.body;
    const id = `AT-${payload.employee_id}-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO attendance (id, employee_id, date, check_in, check_out, hours, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [id, payload.employee_id, payload.date, payload.check_in, payload.check_out, payload.hours, payload.status]
    );
    res.status(201).json({ data: normalizeNumbers(result.rows[0], numericFields.attendance) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create attendance entry.' });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch audit logs.' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const { action, user_name, entity_type, entity_id, log_type } = req.body;
    const result = await pool.query(
      `INSERT INTO audit_logs (action, user_name, entity_type, entity_id, log_type, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [action, user_name, entity_type || null, entity_id || null, log_type || 'info', new Date().toISOString()]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create audit log.' });
  }
});

app.post('/api/payslips', async (req, res) => {
  try {
    const { employeeId, period, grossPay, netPay } = req.body;
    if (!employeeId || !period || grossPay == null || netPay == null) {
      return res.status(400).json({ error: 'Missing payslip fields.' });
    }

    const id = `${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO payslips (id, employee_id, period, gross_pay, net_pay, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [id, employeeId, period, grossPay, netPay, new Date().toISOString()]
    );
    res.status(201).json({ data: normalizeNumbers(result.rows[0], numericFields.payslips), message: 'Payslip created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create payslip.' });
  }
});

const startServer = async () => {
  await initDatabase();
  app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
