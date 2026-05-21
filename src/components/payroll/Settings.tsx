import React from 'react';
import { Building2, CreditCard, Bell, Database, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Company info saved'); }} className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold">Company Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Company Name</label>
              <input defaultValue="PayrollPro Inc." className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Tax PIN</label>
              <input defaultValue="P051234567K" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Address</label>
              <input defaultValue="123 Business Park, Nairobi" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Currency</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option>KES - Kenyan Shilling</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Pay Cycle</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option>Monthly</option>
                  <option>Bi-Weekly</option>
                  <option>Weekly</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Save Changes</button>
          </div>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); toast.success('Tax rates updated'); }} className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold">Statutory Rates</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">NSSF Rate (%)</label>
                <input type="number" defaultValue="6" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">SHIF Rate (%)</label>
                <input type="number" defaultValue="2.75" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Pension Rate (%)</label>
                <input type="number" defaultValue="5" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Personal Relief (KES)</label>
                <input type="number" defaultValue="2400" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Overtime Rate</label>
                <input type="number" defaultValue="1.5" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">NSSF Cap (KES)</label>
                <input type="number" defaultValue="72000" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Update Rates</button>
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold">Notification Preferences</h3>
          </div>
          <div className="space-y-3">
            {[
              'Email payslips to employees automatically',
              'Send salary payment notifications',
              'Notify on payroll approval required',
              'Tax filing deadline reminders',
              'Daily attendance summary',
              'Leave request alerts',
            ].map((label, i) => (
              <label key={i} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-700">{label}</span>
                <input type="checkbox" defaultChecked={i < 4} className="w-9 h-5 appearance-none bg-slate-200 rounded-full relative cursor-pointer checked:bg-blue-600 transition before:absolute before:left-0.5 before:top-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-4" />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-green-600" />
            <h3 className="font-bold">Integrations</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Bank Payment Gateway', status: 'Connected', desc: 'Equity Bank API for salary transfers', color: 'green' },
              { name: 'Accounting Software', status: 'Connected', desc: 'QuickBooks Online integration', color: 'green' },
              { name: 'Biometric Attendance', status: 'Setup', desc: 'Connect ZKTeco devices', color: 'orange' },
              { name: 'KRA iTax', status: 'Connected', desc: 'PAYE returns submission', color: 'green' },
              { name: 'Email Service', status: 'Connected', desc: 'SMTP for payslip delivery', color: 'green' },
            ].map((int, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{int.name}</p>
                  <p className="text-xs text-slate-500">{int.desc}</p>
                </div>
                <button onClick={() => toast.success(`${int.name} configured`)} className={`px-3 py-1 rounded-full text-xs font-medium ${
                  int.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {int.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
