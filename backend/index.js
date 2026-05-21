import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
    .map(item => item.id)
    .filter(id => id.startsWith(prefix))
    .map(id => Number(id.replace(/[^0-9]/g, '')))
    .filter(Number.isFinite);
  const max = ids.length ? Math.max(...ids) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
};

app.get('/', (req, res) => {
  res.json({ message: 'Payroll Salary System backend is running.' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = employees.find((emp) => emp.email === email && emp.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const { password: _password, ...userData } = user;
  res.json({ data: userData });
});

app.get('/api/employees', (req, res) => {
  res.json({ data: employees.map(({ password, ...rest }) => rest) });
});

app.get('/api/employees/:id', (req, res) => {
  const employee = employees.find(emp => emp.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }
  const { password: _password, ...safeEmployee } = employee;
  res.json({ data: safeEmployee });
});

app.post('/api/employees', (req, res) => {
  const payload = req.body;
  const newEmployee = {
    id: getNextId('EMP', employees),
    ...payload,
    created_at: new Date().toISOString(),
  };
  employees.unshift(newEmployee);
  const { password: _password, ...safeEmployee } = newEmployee;
  res.status(201).json({ data: safeEmployee });
});

app.put('/api/employees/:id', (req, res) => {
  const index = employees.findIndex(emp => emp.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found.' });
  }
  employees[index] = { ...employees[index], ...req.body };
  const { password: _password, ...safeEmployee } = employees[index];
  res.json({ data: safeEmployee });
});

app.delete('/api/employees/:id', (req, res) => {
  const index = employees.findIndex(emp => emp.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found.' });
  }
  const deleted = employees.splice(index, 1)[0];
  const { password: _password, ...safeEmployee } = deleted;
  res.json({ data: safeEmployee });
});

app.get('/api/payroll', (req, res) => {
  res.json({ data: payrollRecords });
});

app.post('/api/payroll-records', (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  const records = payload.map(record => ({
    ...record,
    id: record.id || `PAY-${record.employee_id}-${Date.now()}`,
    created_at: new Date().toISOString(),
  }));
  payrollRecords.unshift(...records);
  res.status(201).json({ data: records });
});

app.put('/api/payroll-records/:id', (req, res) => {
  const index = payrollRecords.findIndex(record => record.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Payroll record not found.' });
  }
  payrollRecords[index] = { ...payrollRecords[index], ...req.body };
  res.json({ data: payrollRecords[index] });
});

app.get('/api/leave-requests', (req, res) => {
  res.json({ data: leaveRequests });
});

app.post('/api/leave-requests', (req, res) => {
  const payload = req.body;
  const newRequest = {
    id: `LV-${payload.employee_id}-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
  };
  leaveRequests.unshift(newRequest);
  res.status(201).json({ data: newRequest });
});

app.put('/api/leave-requests/:id', (req, res) => {
  const index = leaveRequests.findIndex(lr => lr.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }
  leaveRequests[index] = { ...leaveRequests[index], ...req.body };
  res.json({ data: leaveRequests[index] });
});

app.get('/api/attendance', (req, res) => {
  res.json({ data: attendance });
});

app.post('/api/attendance', (req, res) => {
  const payload = req.body;
  const newEntry = {
    id: `AT-${payload.employee_id}-${Date.now()}`,
    ...payload,
  };
  attendance.unshift(newEntry);
  res.status(201).json({ data: newEntry });
});

app.get('/api/audit-logs', (req, res) => {
  res.json({ data: auditLogs });
});

app.post('/api/audit-logs', (req, res) => {
  const payload = req.body;
  const nextId = auditLogs.length ? Math.max(...auditLogs.map(log => log.id)) + 1 : 1;
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
  res.status(201).json({ data: entry });
});

app.post('/api/payslips', (req, res) => {
  const { employeeId, period, grossPay, netPay } = req.body;
  if (!employeeId || !period || grossPay == null || netPay == null) {
    return res.status(400).json({ error: 'Missing payslip fields.' });
  }

  const payslip = {
    id: `${Date.now()}`,
    employee_id: employeeId,
    period,
    gross_pay: grossPay,
    net_pay: netPay,
    created_at: new Date().toISOString(),
  };

  res.status(201).json({ data: payslip, message: 'Payslip created successfully.' });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
