'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import destinations from '@/lib/db/destinations.json';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

export default function Home() {
  const router = useRouter();
  
  // Destination State
  const [dest, setDest] = useState('');
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  
  // Date State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs for click outside
  const destRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest) return alert("Please select a destination.");
    if (!dateRange?.from || !dateRange?.to) return alert("Please select a full date range (start and end).");
    
    const matched = destinations.find(d => d.name.toLowerCase() === dest.toLowerCase());
    const queryDest = matched ? matched.id : dest.toLowerCase().replace(' ', '-');
    const start = format(dateRange.from, 'yyyy-MM-dd');
    const end = format(dateRange.to, 'yyyy-MM-dd');
    router.push(`/planner?dest=${queryDest}&start=${start}&end=${end}`);
  };

  const filteredDestinations = dest 
    ? destinations.filter(d => d.name.toLowerCase().includes(dest.toLowerCase()) || d.country.toLowerCase().includes(dest.toLowerCase()))
    : destinations;

  return (
    <div className="min-h-screen bg-ink-50 text-slate-900 font-sans selection:bg-cyan-500/30">
      <header className="absolute top-0 inset-x-0 z-40">
        <nav aria-label="Primary" className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between text-white">
          <Link href="/" className="flex items-center gap-2.5 rounded">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-950 via-iris-500 to-cyan-500 text-white text-sm font-bold shadow-soft">⚡</span>
            <span className="font-heading text-[20px] tracking-tight">TripPulse</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 font-mono text-[11px] uppercase tracking-wider ml-1">v0.1</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link className="inline-flex items-center px-4 h-9 rounded-full text-sm font-semibold text-white bg-indigo-950 hover:bg-indigo-950/90 shadow-glow-cyan" href="#explore">Plan a trip <span aria-hidden="true" className="ml-1">→</span></Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "linear-gradient(160deg, rgba(30,27,75,.70) 0%, rgba(99,102,241,.45) 50%, rgba(6,182,212,.50) 100%), url('https://picsum.photos/seed/tripulse-hero-bali-cliff/1920/1080')" }}>
        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 lg:pt-44 lg:pb-32 text-white">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/25 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            AI itineraries · alive as the world moves
          </span>
          <h1 id="hero-title" className="mt-6 font-heading font-light text-5xl sm:text-7xl lg:text-[88px] tracking-tight leading-tight max-w-4xl">
            Your trip, <em className="italic font-medium" style={{ background: "linear-gradient(90deg,#A5B4FC,#67E8F9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>alive.</em>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/90 max-w-2xl">
            Crafted by AI. Shaped by you. Reshaped by weather, mood, and the unrepeatable moments you stumble into.
          </p>

          <form onSubmit={handleSearch} className="mt-10 grid grid-cols-1 md:grid-cols-[1.4fr_2fr_auto] gap-2 p-2 rounded-full bg-ink-50/95 backdrop-blur shadow-soft text-slate-900 max-w-4xl" role="search" aria-label="Plan a trip">
            
            {/* Destination Autocomplete */}
            <div ref={destRef} className="relative group flex items-center gap-3 px-5 py-2 rounded-full hover:bg-ink-100/70">
              <span className="flex flex-col text-left w-full">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Where</span>
                <input 
                  type="text"
                  value={dest} 
                  onChange={e => { setDest(e.target.value); setShowDestDropdown(true); }}
                  onFocus={() => setShowDestDropdown(true)}
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400" 
                  placeholder="Bali, Kyoto, Iceland…" 
                  autoComplete="off"
                />
              </span>
              
              {showDestDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-ink-200 rounded-2xl shadow-soft z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-2">
                    {filteredDestinations.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No destinations found. Press enter to search anyway.</div>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{dest ? 'Search Results' : 'Popular Destinations'}</div>
                        <ul>
                          {filteredDestinations.map(d => (
                            <li key={d.id}>
                              <button 
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-ink-50 flex flex-col focus:bg-ink-50 outline-none"
                                onClick={() => {
                                  setDest(d.name);
                                  setShowDestDropdown(false);
                                }}
                              >
                                <span className="font-medium text-slate-900">{d.name}</span>
                                <span className="text-xs text-slate-500">{d.country}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div ref={dateRef} className="relative group flex items-center gap-3 px-5 py-2 rounded-full hover:bg-ink-100/70">
              <button 
                type="button" 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex flex-col text-left w-full focus:outline-none"
              >
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Dates</span>
                <span className={`text-sm ${!dateRange?.from ? 'text-slate-400' : 'text-slate-900'}`}>
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Select trip dates'
                  )}
                </span>
              </button>

              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-ink-200 rounded-2xl shadow-soft z-50 p-4">
                  <style dangerouslySetInnerHTML={{__html: `
                    .rdp { --rdp-accent-color: #4F46E5; --rdp-background-color: #F4F4F5; margin: 0; }
                    .rdp-day_selected { font-weight: bold; }
                  `}} />
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    pagedNavigation
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setShowDatePicker(false)}
                      className="px-4 py-2 bg-indigo-950 text-white text-sm font-medium rounded-full hover:bg-indigo-950/90"
                    >
                      Apply Dates
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="inline-flex items-center justify-center gap-2 px-8 rounded-full bg-indigo-950 hover:bg-indigo-950/90 text-white text-sm font-semibold shadow-glow-cyan m-1">
              Begin <span aria-hidden="true">→</span>
            </button>
          </form>

          <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl">
            <div><dt className="text-[11px] uppercase tracking-wider text-white/70">Destinations</dt><dd className="font-heading text-3xl">92</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-white/70">Trips planned</dt><dd className="font-heading text-3xl">1.2k</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-white/70">Avg. p95 gen</dt><dd className="font-heading text-3xl">3.4s</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wider text-white/70">Accessibility</dt><dd className="font-heading text-3xl">AA</dd></div>
          </dl>
        </div>
      </section>

      {/* ── EXPLORE ──────────────────────────────────────── */}
      <section id="explore" className="relative">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20 text-xs font-medium">Where dreams unfold</span>
              <h2 className="mt-4 font-heading text-4xl sm:text-5xl tracking-tight font-light">
                Begin somewhere <em className="italic font-medium text-indigo-950">unforgettable.</em>
              </h2>
              <p className="mt-3 text-slate-600 max-w-xl">A handpicked atlas. One tap and we&apos;ll start writing your story.</p>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {destinations.map((d) => (
              <li key={d.id}>
                <Link href={`/planner?dest=${d.id}&start=2024-06-01&end=2024-06-07`} className="group relative block overflow-hidden rounded-3xl aspect-[4/5] shadow-soft focus-visible:outline-2 focus-visible:outline-cyan-500" style={{ backgroundImage: `url('${d.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent"></div>
                  <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-medium">{d.country}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-heading text-3xl tracking-tight font-light">{d.name}</h3>
                    <p className="text-base text-white/85 mt-1 max-w-sm line-clamp-2">{d.description}</p>
                    <div className="mt-4 flex items-center justify-between text-[12px] font-mono uppercase tracking-wider text-white/85">
                      <span>{d.tags.slice(0, 2).join(' · ')}</span><span className="opacity-90 group-hover:translate-x-1 transition-transform">Plan →</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
