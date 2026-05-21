import React, { useState, useMemo } from 'react';
import { usePayroll } from '@/contexts/PayrollContext';
import { Clock, CheckCircle2, XCircle, AlertCircle, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const Attendance: React.FC = () => {
  const { employees, attendance, leaveRequests, approveLeave, addLeaveRequest } = usePayroll();
  const [tab, setTab] = useState<'attendance' | 'leave' | 'overtime'>('attendance');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '', type: 'Annual Leave', startDate: '', endDate: '', reason: '',
  });

  const empMap = useMemo(() => {
    const m: Record<string, any> = {};
    employees.forEach(e => { m[e.id] = e; });
    return m;
  }, [employees]);

  const enrichedAtt = attendance.map(a => ({ ...a, employee: empMap[a.employeeId] })).filter(a => a.employee);
  const enrichedLeave = leaveRequests.map(l => ({ ...l, employee: empMap[l.employeeId] })).filter(l => l.employee);

  // Synthesize overtime from payroll records or just sample
  const overtime = employees.slice(0, 8).map((e, i) => ({
    ...e,
    date: `2026-05-${15 + i}`,
    hours: 2 + (i % 4),
    rate: 1.5,
    status: i % 2 === 0 ? 'Approved' : 'Pending',
  }));

  const presentCount = enrichedAtt.filter(s => s.status === 'Present').length;
  const lateCount = enrichedAtt.filter(s => s.status === 'Late').length;
  const absentCount = enrichedAtt.filter(s => s.status === 'Absent').length;

  const handleLeaveApprove = async (id: string, status: 'Approved' | 'Rejected') => {
    await approveLeave(id, status);
    toast.success(`Leave ${status.toLowerCase()}`);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    await addLeaveRequest({
      employeeId: leaveForm.employeeId,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days,
      reason: leaveForm.reason,
      status: 'Pending',
    });
    toast.success('Leave request submitted');
    setShowLeaveForm(false);
    setLeaveForm({ employeeId: '', type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
          <p className="text-2xl font-bold">{presentCount}</p>
          <p className="text-xs text-slate-500">Present</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
          <p className="text-2xl font-bold">{lateCount}</p>
          <p className="text-xs text-slate-500">Late Arrivals</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
          <p className="text-2xl font-bold">{absentCount}</p>
          <p className="text-xs text-slate-500">Absent</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold">{enrichedLeave.filter(l => l.status === 'Pending').length}</p>
          <p className="text-xs text-slate-500">Leave Requests</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex justify-between items-center">
          <div className="flex">
            {[
              { id: 'attendance', label: 'Daily Attendance' },
              { id: 'leave', label: 'Leave Requests' },
              { id: 'overtime', label: 'Overtime Tracking' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'leave' && (
            <button onClick={() => setShowLeaveForm(true)} className="mr-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          )}
        </div>

        {tab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrichedAtt.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No attendance records found</td></tr>
                )}
                {enrichedAtt.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={s.employee.avatar} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <p className="font-medium">{s.employee.name}</p>
                          <p className="text-xs text-slate-500">{s.employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.date}</td>
                    <td className="px-4 py-3">{s.status === 'Absent' ? '—' : s.checkIn}</td>
                    <td className="px-4 py-3">{s.status === 'Absent' ? '—' : s.checkOut}</td>
                    <td className="px-4 py-3 font-medium">{s.hours}h</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'Present' ? 'bg-green-100 text-green-700' :
                        s.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'leave' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Days</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrichedLeave.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No leave requests</td></tr>
                )}
                {enrichedLeave.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={l.employee.avatar} className="w-8 h-8 rounded-full" alt="" />
                        <span className="font-medium">{l.employee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{l.type}</td>
                    <td className="px-4 py-3 text-slate-600">{l.startDate} → {l.endDate}</td>
                    <td className="px-4 py-3 font-medium">{l.days} days</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        l.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        l.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === 'Pending' && (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleLeaveApprove(l.id, 'Approved')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleLeaveApprove(l.id, 'Rejected')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'overtime' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtime.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={o.avatar} className="w-8 h-8 rounded-full" alt="" />
                        <span className="font-medium">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.date}</td>
                    <td className="px-4 py-3 font-medium">{o.hours}h</td>
                    <td className="px-4 py-3">{o.rate}x</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLeaveForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold">New Leave Request</h3>
              <button onClick={() => setShowLeaveForm(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Employee</label>
                <select required value={leaveForm.employeeId} onChange={e => setLeaveForm({...leaveForm, employeeId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option value="">Select employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Leave Type</label>
                <select value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Maternity Leave</option>
                  <option>Personal Leave</option>
                  <option>Compassionate Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Start Date</label>
                  <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">End Date</label>
                  <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Reason</label>
                <textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowLeaveForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
