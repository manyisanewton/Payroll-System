import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const connectionString = process.env.DATABASE_URL || '';

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

const isPlaceholderDatabaseUrl = (url) =>
  !url || /user:password|username:password/.test(url);

let dbReady = false;

const employees = [
  {
    id: 'EMP0001',
    name: 'Alice Johnson',
    email: 'admin@example.com',
    password: 'password123',
    role: 'Admin',
    id_number: 'A1234567',
    department: 'Finance',
    position: 'Payroll Manager',
    basic_salary: 70000,
    allowances: 12000,
    bank_name: 'Equity Bank',
    bank_account: '1234567890',
    status: 'Active',
    join_date: '2023-01-15',
    avatar: 'https://i.pravatar.cc/150?img=12',
    created_at: new Date().toISOString(),
  },
  {
    id: 'EMP0002',
    name: 'Marcus Reed',
    email: 'hr@example.com',
    password: 'password123',
    role: 'HR',
    id_number: 'B2345678',
    department: 'Human Resources',
    position: 'HR Specialist',
    basic_salary: 54000,
    allowances: 8000,
    bank_name: 'KCB Bank',
    bank_account: '2345678901',
    status: 'Active',
    join_date: '2024-03-21',
    avatar: 'https://i.pravatar.cc/150?img=34',
    created_at: new Date().toISOString(),
  },
  {
    id: 'EMP0003',
    name: 'Tina Patel',
    email: 'employee@example.com',
    password: 'password123',
    role: 'Employee',
    id_number: 'C3456789',
    department: 'Accounting',
    position: 'Senior Accountant',
    basic_salary: 65000,
    allowances: 9000,
    bank_name: 'Stanbic Bank',
    bank_account: '3456789012',
    status: 'On Leave',
    join_date: '2022-05-09',
    avatar: 'https://i.pravatar.cc/150?img=56',
    created_at: new Date().toISOString(),
  },
];

const payrollRecords = [
  {
    id: 'PAY-EMP0003-001',
    employee_id: 'EMP0003',
    month: '2026-05',
    basic_salary: 65000,
    allowances: 9000,
    overtime: 1200,
    bonus: 500,
    gross_salary: 75700,
    paye: 9084,
    nssf: 2271,
    nhif: 1700,
    pension: 1514,
    other_deductions: 650,
    total_deductions: 13519,
    net_salary: 62181,
    status: 'Paid',
    payment_date: '2026-05-28',
    created_at: new Date().toISOString(),
  },
];

const leaveRequests = [
  {
    id: 'LV-EMP0003-001',
    employee_id: 'EMP0003',
    type: 'Annual Leave',
    start_date: '2026-06-01',
    end_date: '2026-06-10',
    days: 8,
    reason: 'Family travel',
    status: 'Pending',
    created_at: new Date().toISOString(),
  },
];

const attendance = [
  {
    id: 'AT-EMP0003-001',
    employee_id: 'EMP0003',
    date: '2026-05-20',
    check_in: '08:10',
    check_out: '17:00',
    hours: 8,
    status: 'Present',
  },
];

const auditLogs = [
  {
    id: 1,
    action: 'System initialized',
    user_name: 'System',
    entity_type: 'system',
    entity_id: null,
    log_type: 'info',
    created_at: new Date().toISOString(),
  },
];

const getNextId = (prefix, collection) => {
  const ids = collection
    .map((item) => item.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.replace(/[^0-9]/g, '')))
    .filter(Number.isFinite);
  const max = ids.length ? Math.max(...ids) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
};

const sanitizeEmployee = (employee) => {
  const { password, ...rest } = employee;
  return rest;
};

const initDatabase = async () => {
  if (!pool || isPlaceholderDatabaseUrl(connectionString)) {
    console.info('PostgreSQL is not configured or available. Starting in fallback in-memory mode.');
    return;
  }

  try {
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

      const hasEmployees = await client.query('SELECT 1 FROM employees LIMIT 1');
      if (!hasEmployees.rows.length) {
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

    dbReady = true;
    console.log('PostgreSQL database connected and initialized.');
  } catch (error) {
    dbReady = false;
    console.warn('PostgreSQL initialization failed. Backend will use fallback in-memory data.', error.message);
  }
};

const dbQuery = async (text, params = []) => {
  if (!dbReady || !pool) {
    throw new Error('Database not available');
  }
  return pool.query(text, params);
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Payroll Salary System backend is running.' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (dbReady) {
      const result = await dbQuery('SELECT * FROM employees WHERE email = $1 AND password = $2 LIMIT 1', [email, password]);
      if (!result.rows.length) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      return res.json({ data: sanitizeEmployee(result.rows[0]) });
    }

    const user = employees.find((emp) => emp.email === email && emp.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.json({ data: sanitizeEmployee(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at FROM employees ORDER BY name');
      return res.json({ data: result.rows });
    }
    return res.json({ data: employees.map(sanitizeEmployee) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch employees.' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at FROM employees WHERE id = $1', [req.params.id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Employee not found.' });
      }
      return res.json({ data: result.rows[0] });
    }

    const employee = employees.find((emp) => emp.id === req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    return res.json({ data: sanitizeEmployee(employee) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch employee.' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const payload = req.body;
    if (dbReady) {
      const id = getNextId('EMP', employees);
      const createdAt = new Date().toISOString();
      const result = await dbQuery(
        `INSERT INTO employees (id, name, email, password, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
          RETURNING id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at`,
        [
          id,
          payload.name,
          payload.email,
          payload.password,
          payload.role,
          payload.id_number,
          payload.department,
          payload.position,
          payload.basic_salary,
          payload.allowances,
          payload.bank_name,
          payload.bank_account,
          payload.status,
          payload.join_date,
          payload.avatar,
          createdAt,
        ]
      );
      return res.status(201).json({ data: result.rows[0] });
    }

    const newEmployee = {
      id: getNextId('EMP', employees),
      ...payload,
      created_at: new Date().toISOString(),
    };
    employees.unshift(newEmployee);
    return res.status(201).json({ data: sanitizeEmployee(newEmployee) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create employee.' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    if (dbReady) {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (!fields.length) {
        return res.status(400).json({ error: 'No changes provided.' });
      }
      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const query = `UPDATE employees SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at`;
      const result = await dbQuery(query, [...values, req.params.id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Employee not found.' });
      }
      return res.json({ data: result.rows[0] });
    }

    const index = employees.findIndex((emp) => emp.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    employees[index] = { ...employees[index], ...req.body };
    return res.json({ data: sanitizeEmployee(employees[index]) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update employee.' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery(
        'DELETE FROM employees WHERE id = $1 RETURNING id, name, email, role, id_number, department, position, basic_salary, allowances, bank_name, bank_account, status, join_date, avatar, created_at',
        [req.params.id]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Employee not found.' });
      }
      return res.json({ data: result.rows[0] });
    }

    const index = employees.findIndex((emp) => emp.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    const deleted = employees.splice(index, 1)[0];
    return res.json({ data: sanitizeEmployee(deleted) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete employee.' });
  }
});

app.get('/api/payroll', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT * FROM payroll_records ORDER BY created_at DESC');
      return res.json({ data: result.rows });
    }
    return res.json({ data: payrollRecords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch payroll records.' });
  }
});

app.post('/api/payroll-records', async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    if (dbReady) {
      const records = [];
      for (const record of payload) {
        const id = record.id || `PAY-${record.employee_id}-${Date.now()}`;
        const createdAt = new Date().toISOString();
        const result = await dbQuery(
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
        records.push(result.rows[0]);
      }
      return res.status(201).json({ data: records });
    }

    const records = payload.map((record) => {
      const newRecord = {
        ...record,
        id: record.id || `PAY-${record.employee_id}-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      payrollRecords.unshift(newRecord);
      return newRecord;
    });
    return res.status(201).json({ data: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create payroll records.' });
  }
});

app.put('/api/payroll-records/:id', async (req, res) => {
  try {
    if (dbReady) {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (!fields.length) {
        return res.status(400).json({ error: 'No changes provided.' });
      }
      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const query = `UPDATE payroll_records SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
      const result = await dbQuery(query, [...values, req.params.id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Payroll record not found.' });
      }
      return res.json({ data: result.rows[0] });
    }

    const index = payrollRecords.findIndex((record) => record.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }
    payrollRecords[index] = { ...payrollRecords[index], ...req.body };
    return res.json({ data: payrollRecords[index] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update payroll record.' });
  }
});

app.get('/api/leave-requests', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT * FROM leave_requests ORDER BY created_at DESC');
      return res.json({ data: result.rows });
    }
    return res.json({ data: leaveRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch leave requests.' });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const payload = req.body;
    if (dbReady) {
      const id = `LV-${payload.employee_id}-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const result = await dbQuery(
        `INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [id, payload.employee_id, payload.type, payload.start_date, payload.end_date, payload.days, payload.reason, payload.status, createdAt]
      );
      return res.status(201).json({ data: result.rows[0] });
    }

    const newRequest = {
      id: `LV-${payload.employee_id}-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };
    leaveRequests.unshift(newRequest);
    return res.status(201).json({ data: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create leave request.' });
  }
});

app.put('/api/leave-requests/:id', async (req, res) => {
  try {
    if (dbReady) {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (!fields.length) {
        return res.status(400).json({ error: 'No changes provided.' });
      }
      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const query = `UPDATE leave_requests SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
      const result = await dbQuery(query, [...values, req.params.id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Leave request not found.' });
      }
      return res.json({ data: result.rows[0] });
    }

    const index = leaveRequests.findIndex((lr) => lr.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }
    leaveRequests[index] = { ...leaveRequests[index], ...req.body };
    return res.json({ data: leaveRequests[index] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update leave request.' });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT * FROM attendance ORDER BY date DESC');
      return res.json({ data: result.rows });
    }
    return res.json({ data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch attendance.' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const payload = req.body;
    if (dbReady) {
      const id = `AT-${payload.employee_id}-${Date.now()}`;
      const result = await dbQuery(
        `INSERT INTO attendance (id, employee_id, date, check_in, check_out, hours, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, payload.employee_id, payload.date, payload.check_in, payload.check_out, payload.hours, payload.status]
      );
      return res.status(201).json({ data: result.rows[0] });
    }

    const newEntry = {
      id: `AT-${payload.employee_id}-${Date.now()}`,
      ...payload,
    };
    attendance.unshift(newEntry);
    return res.status(201).json({ data: newEntry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create attendance entry.' });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    if (dbReady) {
      const result = await dbQuery('SELECT * FROM audit_logs ORDER BY created_at DESC');
      return res.json({ data: result.rows });
    }
    return res.json({ data: auditLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch audit logs.' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const payload = req.body;
    if (dbReady) {
      const result = await dbQuery(
        `INSERT INTO audit_logs (action, user_name, entity_type, entity_id, log_type, created_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [payload.action, payload.user_name, payload.entity_type || null, payload.entity_id || null, payload.log_type || 'info', new Date().toISOString()]
      );
      return res.status(201).json({ data: result.rows[0] });
    }

    const nextId = auditLogs.length ? Math.max(...auditLogs.map((log) => log.id)) + 1 : 1;
    const entry = {
      id: nextId,
      action: payload.action,
      user_name: payload.user_name,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      log_type: payload.log_type || 'info',
      created_at: new Date().toISOString(),
    };
    auditLogs.unshift(entry);
    return res.status(201).json({ data: entry });
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

    if (dbReady) {
      const id = `${Date.now()}`;
      const result = await dbQuery(
        `INSERT INTO payslips (id, employee_id, period, gross_pay, net_pay, created_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id, employeeId, period, grossPay, netPay, new Date().toISOString()]
      );
      return res.status(201).json({ data: result.rows[0], message: 'Payslip created successfully.' });
    }

    const payslip = {
      id: `${Date.now()}`,
      employee_id: employeeId,
      period,
      gross_pay: grossPay,
      net_pay: netPay,
      created_at: new Date().toISOString(),
    };
    return res.status(201).json({ data: payslip, message: 'Payslip created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create payslip.' });
  }
});

const startServer = async () => {
  await initDatabase();
  app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`);
    if (!dbReady) {
      console.log('PostgreSQL not available; running in fallback in-memory mode.');
    }
  });
};

startServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
