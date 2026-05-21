import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  addEmployee: (emp: Omit<Employee, 'id' | 'avatar'>) => Promise<void>;
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
    const { data } = await supabase
      .from('audit_logs')
      .insert([{ action, user_name: currentUser.name, log_type: logType, entity_type: entityType, entity_id: entityId }])
      .select()
      .single();
    if (data) setAuditLogs(prev => [dbToAudit(data), ...prev]);
  }, [currentUser.name]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [empRes, payRes, leaveRes, attRes, auditRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('payroll_records').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').order('date', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (empRes.data) setEmployees(empRes.data.map(dbToEmployee));
    if (payRes.data) setPayrollRecords(payRes.data.map(dbToPayroll));
    if (leaveRes.data) setLeaveRequests(leaveRes.data.map(dbToLeave));
    if (attRes.data) setAttendance(attRes.data.map(dbToAttendance));
    if (auditRes.data) setAuditLogs(auditRes.data.map(dbToAudit));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEmployee = async (emp: Omit<Employee, 'id' | 'avatar'>) => {
    // Generate new ID based on max existing
    const maxId = employees.reduce((max, e) => {
      const num = parseInt(e.id.replace(/\D/g, ''), 10);
      return num > max ? num : max;
    }, 1000);
    const newEmp: Employee = {
      ...emp,
      id: `EMP${String(maxId + 1).padStart(4, '0')}`,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
    };
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeToDb(newEmp)])
      .select()
      .single();
    if (error) { console.error(error); return; }
    if (data) {
      setEmployees(prev => [dbToEmployee(data), ...prev]);
      await logAudit(`Employee added: ${newEmp.name}`, 'success', 'employee', newEmp.id);
    }
  };

  const updateEmployee = async (id: string, emp: Partial<Employee>) => {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeToDb(emp))
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error(error); return; }
    if (data) {
      setEmployees(prev => prev.map(e => e.id === id ? dbToEmployee(data) : e));
      await logAudit(`Employee updated: ${data.name}`, 'info', 'employee', id);
    }
  };

  const deleteEmployee = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setEmployees(prev => prev.filter(e => e.id !== id));
    await logAudit(`Employee deleted: ${emp?.name || id}`, 'warning', 'employee', id);
  };

  const runPayroll = async () => {
    const active = employees.filter(e => e.status === 'Active');
    const newRecords = active.map(e =>
      processPayroll(e, Math.random() > 0.7 ? Math.floor(Math.random() * 15000) : 0)
    );
    // Ensure unique IDs
    const withUnique = newRecords.map((r, i) => ({ ...r, id: `${r.id}-${i}` }));
    const { data, error } = await supabase
      .from('payroll_records')
      .insert(withUnique.map(payrollToDb))
      .select();
    if (error) { console.error(error); return; }
    if (data) {
      setPayrollRecords(prev => [...data.map(dbToPayroll), ...prev]);
      await logAudit(`Payroll processed for ${active.length} employees`, 'success', 'payroll');
    }
  };

  const approvePayroll = async (id: string) => {
    const { data, error } = await supabase
      .from('payroll_records')
      .update({ status: 'Paid' })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error(error); return; }
    if (data) {
      setPayrollRecords(prev => prev.map(p => p.id === id ? dbToPayroll(data) : p));
      await logAudit(`Payslip approved: ${id}`, 'success', 'payroll', id);
    }
  };

  const approveLeave = async (id: string, status: 'Approved' | 'Rejected') => {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error(error); return; }
    if (data) {
      setLeaveRequests(prev => prev.map(l => l.id === id ? dbToLeave(data) : l));
      await logAudit(`Leave request ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'warning', 'leave', id);
    }
  };

  const addLeaveRequest = async (lr: Omit<LeaveRequest, 'id'>) => {
    const id = `LV-${lr.employeeId}-${Date.now()}`;
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        id,
        employee_id: lr.employeeId,
        type: lr.type,
        start_date: lr.startDate,
        end_date: lr.endDate,
        days: lr.days,
        reason: lr.reason,
        status: lr.status,
      }])
      .select()
      .single();
    if (error) { console.error(error); return; }
    if (data) {
      setLeaveRequests(prev => [dbToLeave(data), ...prev]);
      await logAudit('Leave request submitted', 'info', 'leave', id);
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
