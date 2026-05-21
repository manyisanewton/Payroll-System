import React, { useState } from 'react';
import { usePayroll } from '@/contexts/PayrollContext';
import { formatCurrency } from '@/data/payrollData';
import { BarChart3, PieChart, FileDown, FileSpreadsheet, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const Reports: React.FC = () => {
  const { employees, payrollRecords } = usePayroll();
  const [period, setPeriod] = useState('month');

  const totalGross = payrollRecords.reduce((s, r) => s + r.grossSalary, 0);
  const totalNet = payrollRecords.reduce((s, r) => s + r.netSalary, 0);
  const totalPAYE = payrollRecords.reduce((s, r) => s + r.paye, 0);
  const totalNSSF = payrollRecords.reduce((s, r) => s + r.nssf, 0);
  const totalNHIF = payrollRecords.reduce((s, r) => s + r.nhif, 0);
  const totalPension = payrollRecords.reduce((s, r) => s + r.pension, 0);

  const deptData = employees.reduce((acc, e) => {
    if (!acc[e.department]) acc[e.department] = { count: 0, salary: 0 };
    acc[e.department].count++;
    acc[e.department].salary += e.basicSalary;
    return acc;
  }, {} as Record<string, { count: number; salary: number }>);

  const reports = [
    { id: 1, name: 'Monthly Payroll Summary', desc: 'Complete payroll breakdown for the period', icon: Calendar, color: 'blue' },
    { id: 2, name: 'PAYE Tax Report', desc: 'Tax deductions for KRA submission', icon: TrendingUp, color: 'red' },
    { id: 3, name: 'NSSF Contribution Report', desc: 'Statutory pension contributions', icon: Users, color: 'green' },
    { id: 4, name: 'SHIF/NHIF Report', desc: 'Health insurance deductions summary', icon: TrendingUp, color: 'purple' },
    { id: 5, name: 'Department Cost Analysis', desc: 'Salary expenditure by department', icon: BarChart3, color: 'orange' },
    { id: 6, name: 'Bank Payment File', desc: 'Bank transfer instructions export', icon: DollarSign, color: 'indigo' },
    { id: 7, name: 'Year-to-Date Summary', desc: 'YTD earnings and deductions report', icon: Calendar, color: 'cyan' },
    { id: 8, name: 'Employee Payment History', desc: 'Individual employee payment records', icon: Users, color: 'pink' },
  ];

  const handleExport = (name: string, format: string) => {
    toast.success(`Exporting ${name} as ${format}`);
    setTimeout(() => {
      const blob = new Blob([`Report: ${name}\nGenerated: ${new Date().toISOString()}\nFormat: ${format}\n\nTotal Records: ${payrollRecords.length}\nTotal Gross: ${formatCurrency(totalGross)}\nTotal Net: ${formatCurrency(totalNet)}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}.${format.toLowerCase()}`;
      a.click();
    }, 500);
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  const maxSalary = Math.max(...Object.values(deptData).map(d => d.salary));
  const totalDeductions = totalPAYE + totalNSSF + totalNHIF + totalPension;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[
          { id: 'month', label: 'This Month' },
          { id: 'quarter', label: 'This Quarter' },
          { id: 'year', label: 'This Year' },
          { id: 'all', label: 'All Time' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              period === p.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Total Gross</p>
          <p className="text-2xl font-bold">{formatCurrency(totalGross)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Total Net Pay</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalNet)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Records Processed</p>
          <p className="text-2xl font-bold">{payrollRecords.length}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-1">Statutory Deductions Breakdown</h3>
          <p className="text-xs text-slate-500 mb-5">Breakdown of all statutory contributions</p>
          <div className="space-y-3">
            {[
              { label: 'PAYE Tax', value: totalPAYE, color: 'bg-red-500' },
              { label: 'NSSF', value: totalNSSF, color: 'bg-blue-500' },
              { label: 'SHIF/NHIF', value: totalNHIF, color: 'bg-purple-500' },
              { label: 'Pension', value: totalPension, color: 'bg-green-500' },
            ].map(d => (
              <div key={d.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{d.label}</span>
                  <span className="font-semibold">{formatCurrency(d.value)}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full transition-all duration-700`} style={{ width: `${(d.value / totalDeductions) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-1">Department Headcount & Salary</h3>
          <p className="text-xs text-slate-500 mb-5">Distribution across departments</p>
          <div className="space-y-3">
            {Object.entries(deptData).sort((a, b) => b[1].salary - a[1].salary).map(([dept, data]) => (
              <div key={dept} className="flex items-center gap-3">
                <div className="w-28 text-sm font-medium text-slate-700 truncate">{dept}</div>
                <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center px-2 transition-all duration-700" style={{ width: `${(data.salary / maxSalary) * 100}%` }}>
                    <span className="text-xs text-white font-semibold">{data.count} ppl</span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-700 w-24 text-right">{formatCurrency(data.salary)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report library */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="mb-5">
          <h3 className="font-bold text-slate-900">Report Library</h3>
          <p className="text-sm text-slate-500">Generate and export comprehensive payroll reports</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${colorMap[r.color]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900">{r.name}</h4>
                    <p className="text-xs text-slate-500">{r.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExport(r.name, 'PDF')} className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 flex items-center justify-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => handleExport(r.name, 'XLSX')} className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 flex items-center justify-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button onClick={() => handleExport(r.name, 'CSV')} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
