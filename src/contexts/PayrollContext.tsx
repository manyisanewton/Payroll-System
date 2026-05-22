import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Employee, PayrollRecord, LeaveRequest, AttendanceRecord, AuditLog,
  dbToEmployee, employeeToDb, dbToPayroll, payrollToDb, dbToLeave, dbToAttendance, dbToAudit,
  processPayroll,
} from '@/data/payrollData';

interface PayrollContextType {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  auditLogs: AuditLog[];
  loading: boolean;
  refresh: () => Promise<void>;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  runPayroll: () => Promise<void>;
  approvePayroll: (id: string) => Promise<void>;
  approveLeave: (id: string, status: 'Approved' | 'Rejected') => Promise<void>;
  addLeaveRequest: (lr: Omit<LeaveRequest, 'id'>) => Promise<void>;
  logAudit: (action: string, logType?: AuditLog['logType'], entityType?: string, entityId?: string) => Promise<void>;
  currentView: string;
  setCurrentView: (v: string) => void;
  currentUser: { name: string; role: 'Admin' | 'HR' | 'Employee'; avatar: string };
  setCurrentUser: (u: any) => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_URL || '';

const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const fetchJson = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    const errorMessage = typeof body === 'string' ? body : body?.error || 'API request failed';
    throw new Error(errorMessage);
  }
  return body;
};

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({
    name: 'Alex Morgan',
    role: 'Admin' as const,
    avatar: 'https://i.pravatar.cc/150?img=12',
  });

  const logAudit = useCallback(async (action: string, logType: AuditLog['logType'] = 'info', entityType?: string, entityId?: string) => {
    try {
      const result = await fetchJson('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action, user_name: currentUser.name, log_type: logType, entity_type: entityType, entity_id: entityId }),
      });
      if (result.data) setAuditLogs(prev => [dbToAudit(result.data), ...prev]);
    } catch (error) {
      console.error('Audit log failed', error);
    }
  }, [currentUser.name]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, payRes, leaveRes, attRes, auditRes] = await Promise.all([
        fetchJson('/api/employees'),
        fetchJson('/api/payroll'),
        fetchJson('/api/leave-requests'),
        fetchJson('/api/attendance'),
        fetchJson('/api/audit-logs'),
      ]);
      if (empRes.data) setEmployees(empRes.data.map(dbToEmployee));
      if (payRes.data) setPayrollRecords(payRes.data.map(dbToPayroll));
      if (leaveRes.data) setLeaveRequests(leaveRes.data.map(dbToLeave));
      if (attRes.data) setAttendance(attRes.data.map(dbToAttendance));
      if (auditRes.data) setAuditLogs(auditRes.data.map(dbToAudit));
    } catch (error) {
      console.error('Refresh failed', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    try {
      const payload = employeeToDb(emp);
      const result = await fetchJson('/api/employees', { method: 'POST', body: JSON.stringify(payload) });
      if (result.data) {
        setEmployees(prev => [dbToEmployee(result.data), ...prev]);
        await logAudit(`Employee added: ${result.data.name}`, 'success', 'employee', result.data.id);
      }
    } catch (error) {
      console.error('Add employee failed', error);
    }
  };

  const updateEmployee = async (id: string, emp: Partial<Employee>) => {
    try {
      const payload = employeeToDb(emp);
      const result = await fetchJson(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (result.data) {
        setEmployees(prev => prev.map(e => e.id === id ? dbToEmployee(result.data) : e));
        await logAudit(`Employee updated: ${result.data.name}`, 'info', 'employee', id);
      }
    } catch (error) {
      console.error('Update employee failed', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const emp = employees.find(e => e.id === id);
      await fetchJson(`/api/employees/${id}`, { method: 'DELETE' });
      setEmployees(prev => prev.filter(e => e.id !== id));
      await logAudit(`Employee deleted: ${emp?.name || id}`, 'warning', 'employee', id);
    } catch (error) {
      console.error('Delete employee failed', error);
    }
  };

  const runPayroll = async () => {
    try {
      const active = employees.filter(e => e.status === 'Active');
      const newRecords = active.map(e => processPayroll(e, Math.random() > 0.7 ? Math.floor(Math.random() * 15000) : 0));
      const withUnique = newRecords.map((r, i) => ({ ...r, id: `${r.id}-${i}` }));
      const payload = withUnique.map(payrollToDb);
      const result = await fetchJson('/api/payroll-records', { method: 'POST', body: JSON.stringify(payload) });
      if (result.data) {
        setPayrollRecords(prev => [...result.data.map(dbToPayroll), ...prev]);
        await logAudit(`Payroll processed for ${active.length} employees`, 'success', 'payroll');
      }
    } catch (error) {
      console.error('Run payroll failed', error);
    }
  };

  const approvePayroll = async (id: string) => {
    try {
      const result = await fetchJson(`/api/payroll-records/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Paid' }) });
      if (result.data) {
        setPayrollRecords(prev => prev.map(p => p.id === id ? dbToPayroll(result.data) : p));
        await logAudit(`Payslip approved: ${id}`, 'success', 'payroll', id);
      }
    } catch (error) {
      console.error('Approve payroll failed', error);
    }
  };

  const approveLeave = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const result = await fetchJson(`/api/leave-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (result.data) {
        setLeaveRequests(prev => prev.map(l => l.id === id ? dbToLeave(result.data) : l));
        await logAudit(`Leave request ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'warning', 'leave', id);
      }
    } catch (error) {
      console.error('Approve leave failed', error);
    }
  };

  const addLeaveRequest = async (lr: Omit<LeaveRequest, 'id'>) => {
    try {
      const payload = {
        employee_id: lr.employeeId,
        type: lr.type,
        start_date: lr.startDate,
        end_date: lr.endDate,
        days: lr.days,
        reason: lr.reason,
        status: lr.status,
      };
      const result = await fetchJson('/api/leave-requests', { method: 'POST', body: JSON.stringify(payload) });
      if (result.data) {
        setLeaveRequests(prev => [dbToLeave(result.data), ...prev]);
        await logAudit('Leave request submitted', 'info', 'leave', result.data.id);
      }
    } catch (error) {
      console.error('Add leave request failed', error);
    }
  };

  const value = useMemo(() => ({
    employees, payrollRecords, leaveRequests, attendance, auditLogs, loading,
    refresh, addEmployee, updateEmployee, deleteEmployee,
    runPayroll, approvePayroll, approveLeave, addLeaveRequest, logAudit,
    currentView, setCurrentView, currentUser, setCurrentUser,
  }), [employees, payrollRecords, leaveRequests, attendance, auditLogs, loading, currentView, currentUser, refresh, logAudit]);

  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>;
};

export const usePayroll = () => {
  const ctx = useContext(PayrollContext);
  if (!ctx) throw new Error('usePayroll must be used within PayrollProvider');
  return ctx;
};
