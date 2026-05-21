import React, { useState } from 'react';
import { usePayroll } from '@/contexts/PayrollContext';
import { formatCurrency, PayrollRecord } from '@/data/payrollData';
import { Download, Printer, Mail, Search, FileText, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export const Payslips: React.FC = () => {
  const { employees, payrollRecords } = usePayroll();
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<PayrollRecord | null>(null);

  const enriched = payrollRecords.map(r => ({
    ...r,
    employee: employees.find(e => e.id === r.employeeId),
  })).filter(r => r.employee);

  const filtered = enriched.filter(r =>
    r.employee!.name.toLowerCase().includes(search.toLowerCase()) ||
    r.employee!.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (r: any) => {
    const content = `PAYSLIP\n\nEmployee: ${r.employee.name}\nID: ${r.employee.id}\nMonth: ${r.month}\n\nBasic: ${formatCurrency(r.basicSalary)}\nAllowances: ${formatCurrency(r.allowances)}\nOvertime: ${formatCurrency(r.overtime)}\nGross: ${formatCurrency(r.grossSalary)}\n\nPAYE: ${formatCurrency(r.paye)}\nNSSF: ${formatCurrency(r.nssf)}\nSHIF: ${formatCurrency(r.nhif)}\nPension: ${formatCurrency(r.pension)}\n\nNET PAY: ${formatCurrency(r.netSalary)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${r.employee.id}.txt`;
    a.click();
    toast.success('Payslip downloaded');
  };

  const handleEmail = (r: any) => {
    toast.success(`Payslip emailed to ${r.employee.email}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search payslips by employee name or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button onClick={() => toast.success('Bulk download started')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Bulk Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, 24).map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src={r.employee!.avatar} className="w-11 h-11 rounded-full" alt="" />
                <div>
                  <p className="font-semibold text-slate-900">{r.employee!.name}</p>
                  <p className="text-xs text-slate-500">{r.employee!.id} • {r.month}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                r.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>{r.status}</span>
            </div>
            <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3 mb-3">
              <div className="flex justify-between"><span className="text-slate-500">Gross</span><span>{formatCurrency(r.grossSalary)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="text-red-600">-{formatCurrency(r.totalDeductions)}</span></div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100"><span>Net Pay</span><span className="text-green-700">{formatCurrency(r.netSalary)}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewing(r)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={() => handleDownload(r)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleEmail(r)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50">
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl print:shadow-none">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 print:hidden">
              <h3 className="font-bold">Payslip Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 rounded-lg"><Printer className="w-4 h-4" /></button>
                <button onClick={() => handleDownload({ ...viewing, employee: employees.find(e => e.id === viewing.employeeId) })} className="p-2 hover:bg-slate-100 rounded-lg"><Download className="w-4 h-4" /></button>
                <button onClick={() => setViewing(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-200 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-lg">PayrollPro Inc.</span>
                  </div>
                  <p className="text-xs text-slate-500">123 Business Park, Nairobi, Kenya<br/>info@payrollpro.co.ke</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Payslip for</p>
                  <p className="font-bold text-lg">{viewing.month}</p>
                </div>
              </div>

              {(() => {
                const emp = employees.find(e => e.id === viewing.employeeId)!;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Employee Name</p>
                        <p className="font-semibold">{emp.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Employee ID</p>
                        <p className="font-semibold">{emp.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Department</p>
                        <p className="font-semibold">{emp.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Position</p>
                        <p className="font-semibold">{emp.position}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Bank</p>
                        <p className="font-semibold">{emp.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Account</p>
                        <p className="font-semibold">{emp.bankAccount}</p>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-bold text-green-900 text-sm mb-3">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Basic Salary</span><span>{formatCurrency(viewing.basicSalary)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Allowances</span><span>{formatCurrency(viewing.allowances)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Overtime</span><span>{formatCurrency(viewing.overtime)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Bonus</span><span>{formatCurrency(viewing.bonus)}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t border-green-200"><span>Gross</span><span>{formatCurrency(viewing.grossSalary)}</span></div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-bold text-red-900 text-sm mb-3">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">PAYE Tax</span><span>{formatCurrency(viewing.paye)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">NSSF</span><span>{formatCurrency(viewing.nssf)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">SHIF/NHIF</span><span>{formatCurrency(viewing.nhif)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Pension</span><span>{formatCurrency(viewing.pension)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Other</span><span>{formatCurrency(viewing.otherDeductions)}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t border-red-200"><span>Total</span><span>{formatCurrency(viewing.totalDeductions)}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-5 mt-5 flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm">Net Pay</p>
                  <p className="text-3xl font-bold">{formatCurrency(viewing.netSalary)}</p>
                </div>
                <div className="text-right text-sm text-blue-100">
                  <p>Payment Date</p>
                  <p className="font-semibold text-white">{viewing.paymentDate}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center mt-6">This is a computer-generated payslip and does not require a signature.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
