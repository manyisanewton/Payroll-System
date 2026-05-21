import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const employees = [
  { id: '1', name: 'Alice Johnson', role: 'Payroll Manager', department: 'Finance', status: 'Active' },
  { id: '2', name: 'Marcus Reed', role: 'HR Specialist', department: 'Human Resources', status: 'Active' },
  { id: '3', name: 'Tina Patel', role: 'Senior Accountant', department: 'Accounting', status: 'On Leave' },
];

const payrollSummary = {
  totalEmployees: employees.length,
  totalPayable: 38540.75,
  totalTaxes: 7814.65,
  lastRun: '2026-05-20T12:00:00.000Z',
};

app.get('/', (req, res) => {
  res.json({ message: 'Payroll Salary System backend is running.' });
});

app.get('/api/employees', (req, res) => {
  res.json({ data: employees });
});

app.get('/api/employees/:id', (req, res) => {
  const employee = employees.find(emp => emp.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }
  res.json({ data: employee });
});

app.put('/api/employees/:id', (req, res) => {
  const index = employees.findIndex(emp => emp.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const updates = req.body;
  employees[index] = { ...employees[index], ...updates };
  res.json({ data: employees[index], message: 'Employee profile updated.' });
});

app.get('/api/payroll', (req, res) => {
  res.json({ data: payrollSummary });
});

app.post('/api/payslips', (req, res) => {
  const { employeeId, period, grossPay, netPay } = req.body;
  if (!employeeId || !period || grossPay == null || netPay == null) {
    return res.status(400).json({ error: 'Missing payslip fields.' });
  }

  const payslip = {
    id: `${Date.now()}`,
    employeeId,
    period,
    grossPay,
    netPay,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json({ data: payslip, message: 'Payslip created successfully.' });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
