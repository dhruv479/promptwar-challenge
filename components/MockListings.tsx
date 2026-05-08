import React from 'react';
import { Plane, Hotel } from 'lucide-react';

export default function MockListings() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white border border-ink-200 rounded-3xl shadow-soft">
        <h3 className="text-xl font-heading font-medium flex items-center gap-2 mb-4 text-slate-900">
          <Plane className="text-indigo-600" />
          Flight Options
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-ink-50 border border-ink-200 rounded-2xl flex justify-between items-center hover:border-indigo-400 transition-colors cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">SkyLink Airlines • Non-stop</p>
              <p className="text-sm text-slate-500">10:00 AM - 2:30 PM (4h 30m)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">$340</p>
            </div>
          </div>
          <div className="p-4 bg-ink-50 border border-ink-200 rounded-2xl flex justify-between items-center hover:border-indigo-400 transition-colors cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">Oceanic Airways • 1 Stop</p>
              <p className="text-sm text-slate-500">08:00 AM - 4:00 PM (8h 00m)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">$215</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border border-ink-200 rounded-3xl shadow-soft">
        <h3 className="text-xl font-heading font-medium flex items-center gap-2 mb-4 text-slate-900">
          <Hotel className="text-indigo-600" />
          Hotel Options
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-ink-50 border border-ink-200 rounded-2xl flex justify-between items-center hover:border-indigo-400 transition-colors cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">Grand Plaza Central</p>
              <p className="text-sm text-slate-500">Downtown • 4.8★</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">$180 / night</p>
            </div>
          </div>
          <div className="p-4 bg-ink-50 border border-ink-200 rounded-2xl flex justify-between items-center hover:border-indigo-400 transition-colors cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800">The Boutique Stay</p>
              <p className="text-sm text-slate-500">Old Town • 4.5★</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">$120 / night</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
