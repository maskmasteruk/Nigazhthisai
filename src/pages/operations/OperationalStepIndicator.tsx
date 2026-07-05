import React from 'react';
import { MapPin, Map as MapIcon, Navigation, CheckCircle2 } from 'lucide-react';

type StepId = 'route' | 'stops' | 'schedule' | 'done';

interface StepIndicatorProps {
  currentStep: StepId;
}

export const OperationalStepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 'route', label: '1. Create Route', icon: MapPin },
    { id: 'stops', label: '2. Manage Stops', icon: MapIcon },
    { id: 'schedule', label: '3. Schedule Trip', icon: Navigation },
    { id: 'done', label: '4. Done', icon: CheckCircle2 }
  ];

  const stepOrder: StepId[] = ['route', 'stops', 'schedule', 'done'];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="mb-10 flex items-center justify-between px-4 overflow-x-auto no-scrollbar py-2 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6">
      {steps.map((s, idx) => {
        const isCurrent = currentStep === s.id;
        const isCompleted = currentIndex > idx;

        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isCurrent 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 border-2 border-slate-900' 
                  : isCompleted 
                    ? 'bg-emerald-500 text-white border-2 border-slate-900' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                <s.icon size={20} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-slate-450'}`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <div className={`flex-1 h-1 min-w-[40px] mx-4 rounded ${
                currentIndex > idx ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
