import React from 'react';
import { Bus, Stop } from '../types';
import { Bus as BusIcon, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapViewProps {
  buses: Bus[];
  stops: Stop[];
  onBusClick?: (bus: Bus) => void;
  selectedBusId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({ buses, stops, onBusClick, selectedBusId }) => {
  // Dynamic coordinate normalization
  const allPoints = [
    ...buses.map(b => ({ lat: b.current_lat, lng: b.current_lng })),
    ...stops.map(s => ({ lat: s.lat, lng: s.lng }))
  ];

  const minLat = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.lat)) - 0.01 : 11.10;
  const maxLat = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.lat)) + 0.01 : 11.16;
  const minLng = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.lng)) - 0.01 : 77.33;
  const maxLng = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.lng)) + 0.01 : 77.40;

  const normalize = (lat: number, lng: number) => {
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    const x = lngRange === 0 ? 50 : ((lng - minLng) / lngRange) * 100;
    const y = latRange === 0 ? 50 : 100 - ((lat - minLat) / latRange) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  const selectedBus = buses.find(b => b.id === selectedBusId);

  // Calculate which stops are passed/upcoming based on selected bus position
  const getStopStatus = (stop: Stop, index: number) => {
    if (!selectedBus) return 'normal';
    
    // Find the index of the stop the bus is closest to
    let minDistance = Infinity;
    let closestIndex = 0;
    
    stops.forEach((s, i) => {
      const dist = Math.sqrt(Math.pow(s.lat - selectedBus.current_lat, 2) + Math.pow(s.lng - selectedBus.current_lng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    });

    if (index < closestIndex) return 'passed';
    if (index === closestIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className={`relative w-full ${selectedBusId ? 'h-[300px]' : 'h-[400px]'} bg-slate-100 border border-slate-200 overflow-hidden shadow-inner transition-all duration-500`}>
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      {/* Routes/Roads (Simplified) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Draw full route line if a bus is selected */}
        {selectedBusId && stops.length > 1 && (
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={`M ${stops.map(s => {
              const { x, y } = normalize(s.lat, s.lng);
              return `${parseFloat(x) * 4},${parseFloat(y) * 3}`; // Scaling for SVG viewbox
            }).join(' L ')}`}
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="text-primary/20"
            style={{ vectorEffect: 'non-scaling-stroke' }}
            viewBox="0 0 400 300"
          />
        )}
        
        {/* Default background routes */}
        <path 
          d="M 10,10 L 90,90 M 10,90 L 90,10" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          className="opacity-50"
        />
      </svg>

      {/* Stops */}
      {stops.map((stop, i) => {
        const { x, y } = normalize(stop.lat, stop.lng);
        const status = getStopStatus(stop, i);
        
        return (
          <div 
            key={i} 
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-0"
            style={{ left: x, top: y }}
          >
            <motion.div 
              initial={false}
              animate={{
                scale: status === 'current' ? 1.5 : 1,
                backgroundColor: status === 'passed' ? '#94a3b8' : status === 'current' ? '#f59e0b' : '#15803d'
              }}
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm" 
            />
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 text-[10px] shadow-sm transition-opacity ${selectedBusId ? (status === 'current' || status === 'upcoming' ? 'opacity-100' : 'opacity-40') : 'opacity-0 group-hover:opacity-100'}`}>
              {stop.name}
            </div>
          </div>
        );
      })}

      {/* Buses */}
      {buses.map((bus) => {
        const { x, y } = normalize(bus.current_lat, bus.current_lng);
        const isSelected = bus.id === selectedBusId;
        const occupancyColor = 
          bus.occupancy === 'low' ? 'bg-primary' : 
          bus.occupancy === 'medium' ? 'bg-amber-500' : 'bg-rose-500';

        if (selectedBusId && !isSelected) return null;

        return (
          <motion.div
            key={bus.id}
            layoutId={bus.id}
            initial={false}
            animate={{ left: x, top: y, scale: isSelected ? 1.2 : 1 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full ${isSelected ? 'bg-accent' : occupancyColor} text-white shadow-lg z-10`}
            onClick={() => onBusClick?.(bus)}
          >
            <BusIcon size={isSelected ? 20 : 16} className={isSelected ? 'animate-pulse' : ''} />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 text-[10px] whitespace-nowrap">
              {bus.id} {isSelected && ' (SELECTED)'}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
