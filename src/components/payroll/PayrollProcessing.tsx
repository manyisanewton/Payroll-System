import React, { useState } from 'react';
import { usePayroll } from '@/contexts/PayrollContext';
import { formatCurrency, processPayroll } from '@/data/payrollData';
import { Calculator, CheckCircle2, Play, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const PayrollProcessing: React.FC = () => {
  const { employees, payrollRecords, runPayroll, approvePayroll } = usePayroll();
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const activeEmps = employees.filter(e => e.status === 'Active');
  const totalGross = activeEmps.reduce((s, e) => s + e.basicSalary + e.allowances, 0);
  const pendingRecords = payrollRecords.filter(p => p.status === 'Pending').slice(0, 12);

  const handleRun = () => {
    setProcessing(true);
    setTimeout(() => {
      runPayroll();
      setProcessing(false);
      setCompleted(true);
      setStep(3);
      toast.success(`Payroll processed for ${activeEmps.length} employees`);
    }, 1800);
  };

  const handleApproveAll = () => {
    pendingRecords.forEach(r => approvePayroll(r.id));
    toast.success(`Approved ${pendingRecords.length} payslips`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { n: 1, label: 'Review Employees' },
            { n: 2, label: 'Process Payroll' },
            { n: 3, label: 'Approve & Pay' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                </div>
                <p className={`text-xs mt-2 font-medium ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</p>
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 ${step > s.n ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Active Employees</p>
              <p className="text-3xl font-bold text-slate-900">{activeEmps.length}</p>
              <p className="text-xs text-green-600 mt-1">Ready for processing</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Total Gross Salary</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalGross)}</p>
              <p className="text-xs text-slate-500 mt-1">Before deductions</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Pay Period</p>
              <p className="text-3xl font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
              <p className="text-xs text-slate-500 mt-1">Monthly cycle</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold">Employees to Process</h3>
              <p className="text-xs text-slate-500">Review eligible employees before running payroll</p>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Employee</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Department</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Basic</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Allowances</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Est. Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeEmps.slice(0, 20).map(e => {
                    const preview = processPayroll(e);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <img src={e.avatar} className="w-7 h-7 rounded-full" alt="" />
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{e.name}</p>
                              <p className="text-xs text-slate-500">{e.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{e.department}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(e.basicSalary)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(e.allowances)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-700">{formatCurrency(preview.netSalary)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
              Continue to Processing <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto">
          {!processing && !completed && (
            <>
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to Process Payroll</h3>
              <p className="text-slate-500 mb-6">
                Calculate salaries, deductions (PAYE, NSSF, SHIF, Pension) and generate payslips for {activeEmps.length} active employees.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
                <p className="font-semibold mb-2">Calculations include:</p>
                {[
                  'PAYE tax based on Kenya tax brackets',
                  'NSSF deduction (6% capped at KES 4,320)',
                  'SHIF/NHIF deduction (2.75% of gross)',
                  'Pension contribution (5%)',
                  'Net salary computation',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleRun} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
                  <Play className="w-4 h-4" /> Run Payroll Now
                </button>
              </div>
            </>
          )}
          {processing && (
            <div className="py-8">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Processing payroll...</p>
              <p className="text-sm text-slate-500">Calculating deductions and generating payslips</p>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold">Payroll Processed Successfully!</h3>
                <p className="text-green-100">Payslips generated for {activeEmps.length} employees. Review and approve below.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold">Pending Approval</h3>
                <p className="text-xs text-slate-500">{pendingRecords.length} payslips awaiting your approval</p>
              </div>
              <button onClick={handleApproveAll} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                Approve All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Employee</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Gross</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Deductions</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Net</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRecords.map(r => {
                    const emp = employees.find(e => e.id === r.employeeId);
                    if (!emp) return null;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <img src={emp.avatar} className="w-7 h-7 rounded-full" alt="" />
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(r.grossSalary)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">-{formatCurrency(r.totalDeductions)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(r.netSalary)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => approvePayroll(r.id)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100">
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={() => { setStep(1); setCompleted(false); }} className="text-sm text-blue-600 font-medium hover:underline">
            Start New Payroll Cycle →
          </button>
        </div>
      )}
    </div>
  );
};
