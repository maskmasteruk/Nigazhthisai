import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  FileText, 
  Send, 
  Phone, 
  Mail, 
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const Support: React.FC = () => {
  const [formState, setFormState] = useState({
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.message) {
      toast.error('Please enter a message');
      return;
    }
    toast.success('Your message has been sent to our technical team');
    setFormState({ subject: '', message: '' });
  };

  const faqs = [
    { q: 'How to register a new bus?', a: 'Go to Operations > Buses and click "Add New Bus". You will need the RC details and ETM ID.' },
    { q: 'Idle alert not clearing?', a: 'Alerts must be manually acknowledged by an Admin. If the bus is moving but still shows idle, check GPS signal strength.' },
    { q: 'User permission mismatch?', a: 'Only Master Admins can modify user roles. Check the "Users & Roles" section under Settings.' },
    { q: 'How to filter by Zone?', a: 'Zone filter is a feature exclusive to Master Administrators. It is available on Dashboard, Monitoring, and Operations lists.' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Support Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-white">
            <HelpCircle size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Help Center</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nigazhthisai Ops Support & Documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900">24/7 Priority Support</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
              <ShieldCheck size={10} />
              Operational for Administrators
            </p>
          </div>
          <a href="tel:+914424794242" className="p-4 bg-white border border-slate-200 text-primary hover:bg-slate-50 transition-all">
            <Phone size={20} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Send us a message</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 text-sm font-bold focus:border-primary outline-none transition-all">
                  <option>Technical Support</option>
                  <option>Revenue Discrepancy</option>
                  <option>Hardware/ETM Issues</option>
                  <option>User Management</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                <div className="flex gap-2">
                  {['Normal', 'High', 'Urgent'].map(p => (
                    <button 
                      key={p}
                      type="button"
                      className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest border transition-all ${p === 'Normal' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Subject</label>
              <input 
                type="text" 
                value={formState.subject}
                onChange={e => setFormState({...formState, subject: e.target.value})}
                placeholder="e.g. GPS Delay in Route 102"
                className="w-full p-4 bg-slate-50 border border-slate-100 text-sm font-bold focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Description</label>
              <textarea 
                rows={5}
                value={formState.message}
                onChange={e => setFormState({...formState, message: e.target.value})}
                placeholder="Describe the issue in detail..."
                className="w-full p-4 bg-slate-50 border border-slate-100 text-sm font-bold focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            <button type="submit" className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
              <Send size={16} />
              Submit Ticket
            </button>
          </form>
        </div>

        {/* Quick Help & FAQs */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Knowledge Base</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="group flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-white transition-all">
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
                    <Book size={14} />
                  </div>
                  User Guide v2.4
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-white transition-all">
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
                    <FileText size={14} />
                  </div>
                  System API Specs
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-white transition-all">
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
                    <Clock size={14} />
                  </div>
                  Maintenance Schedule
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="group cursor-help">
                  <p className="text-sm font-black text-slate-900 mb-1 flex items-center justify-between">
                    {faq.q}
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-all" />
                  </p>
                  <p className="text-xs text-slate-400 font-bold hidden group-hover:block transition-all py-2 border-t border-slate-50 mt-2">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 border-dashed">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Hotline</p>
            <p className="text-lg font-black text-slate-900 mb-4">+91 (044) 2479 4242</p>
            <button className="w-full py-2 text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
              <ExternalLink size={12} />
              Open Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
