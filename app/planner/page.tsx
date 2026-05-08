'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ItineraryDay, ItineraryActivity } from '@/lib/store';
import MapEmbed from '@/components/MapEmbed';
import MockListings from '@/components/MockListings';
import Link from 'next/link';

interface WeatherData {
  list?: {
    main: { temp: number };
    weather: { description: string }[];
  }[];
}

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableActivity({ activity }: { activity: ItineraryActivity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col sm:flex-row gap-4 items-start p-5 bg-white border border-ink-200 rounded-2xl shadow-sm hover:border-indigo-400 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="w-24 font-mono text-xs text-slate-500 flex-shrink-0 mt-1">
        {activity.startTime} - {activity.endTime}
      </div>
      <div>
        <h4 className="font-heading font-medium text-lg text-slate-900">{activity.title}</h4>
        <p className="text-slate-500 text-sm mt-1 capitalize">{activity.type} • {activity.intensity} intensity</p>
      </div>
    </div>
  );
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const destId = searchParams.get('dest');
  const startDateParam = searchParams.get('start');
  const endDateParam = searchParams.get('end');

  const [city, countryCode] = destId ? destId.split('-') : ['', ''];
  const destName = city;
  const fullDestName = countryCode ? `${city}, ${countryCode}` : city;
  const startDate = startDateParam || '2024-06-01';
  const endDate = endDateParam || '2024-06-03';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for DnD
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Zustand state
  const preferences = useAppStore((state) => state.preferences);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!destId) return;
    
    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock_token_for_dev' },
          body: JSON.stringify({
            destinationId: destId,
            startDate,
            endDate,
            preferences
          })
        });

        if (!response.ok) throw new Error('Failed to generate itinerary. Ensure API keys are set.');
        
        const data = await response.json();
        // Give unique IDs to activities if Gemini didn't
        const processedDays = data.itinerary.days.map((day: ItineraryDay) => ({
          ...day,
          activities: day.activities.map((a: ItineraryActivity, i: number) => ({ ...a, id: a.id || `act-${day.date}-${i}` }))
        }));
        
        setDays(processedDays);

        // Fetch Weather asynchronously
        fetch(`/api/weather?city=${fullDestName}`)
          .then(res => res.json())
          .then(wData => {
            if(!wData.error) setWeather(wData);
          }).catch(console.error);

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [destId, destName, startDate, endDate, preferences]);

  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDays((prevDays) => {
        const newDays = [...prevDays];
        const dayActivities = newDays[dayIndex].activities;
        const oldIndex = dayActivities.findIndex((a) => a.id === active.id);
        const newIndex = dayActivities.findIndex((a) => a.id === over.id);
        newDays[dayIndex].activities = arrayMove(dayActivities, oldIndex, newIndex);
        return newDays;
      });
    }
  };

  if (!destId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-3xl font-heading text-slate-900 mb-4">Start your journey</h2>
        <p className="text-slate-500 mb-8 max-w-md">Please return to the home page and search for a destination to begin generating your live itinerary.</p>
        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-medium">Return Home</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-50/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-ink-200">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-heading text-slate-900 mb-2">Crafting your itinerary</h2>
          <p className="text-slate-500">Our AI is handpicking the best spots in {destName} for you. This will just take a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      {/* Left Column: Itinerary Timeline */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-6 border border-red-200 bg-red-50 text-red-700 rounded-3xl">
            <h3 className="font-bold mb-2">Generation Failed</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && days.map((day, dIdx) => (
          <div key={dIdx} className="p-6 sm:p-8 border border-ink-200 bg-ink-50 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-ink-200 pb-4">
               <h3 className="text-2xl font-heading font-light text-slate-900">
                 Day {dIdx + 1} <span className="text-slate-400 font-sans text-lg">— {day.date}</span>
               </h3>
               <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-ink-200 text-slate-600 text-xs font-mono">
                 {day.activities.length} stops
               </span>
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dIdx)}>
              <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {day.activities.map((activity) => (
                    <SortableActivity key={activity.id} activity={activity} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>

      {/* Right Column: Widgets */}
      <div className="space-y-6">
        {/* Weather Widget */}
        {weather && weather.list && weather.list[0] && (
           <div className="p-6 bg-white border border-ink-200 rounded-3xl shadow-soft">
             <h3 className="text-lg font-heading font-medium mb-4 text-slate-900 capitalize flex items-center justify-between">
               <span>{destName} Weather</span>
               <span className="inline-flex px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold">LIVE</span>
             </h3>
             <div className="flex items-center gap-4">
               <div className="text-5xl font-light text-slate-900 tracking-tighter">{Math.round(weather.list[0].main.temp)}°</div>
               <div className="text-slate-500 capitalize">{weather.list[0].weather[0].description}</div>
             </div>
           </div>
        )}
        
        {/* Map Widget */}
        <div className="bg-white p-2 rounded-3xl border border-ink-200 shadow-soft">
          <MapEmbed destination={fullDestName} />
        </div>

        {/* Flight & Hotel Widget */}
        <MockListings />
      </div>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-ink-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-ink-200 h-16 flex items-center sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-950 via-iris-500 to-cyan-500 text-white text-sm font-bold">⚡</span>
            <span className="font-heading text-lg font-medium tracking-tight">TripPulse</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-heading font-light tracking-tight mb-2">Itinerary Planner</h1>
          <p className="text-slate-500">Drag items to reorganize your day.</p>
        </div>
        <Suspense fallback={<div className="p-8 border border-ink-200 rounded-3xl bg-white animate-pulse"><h2 className="text-xl text-indigo-600 font-heading">Loading planner...</h2></div>}>
          <PlannerContent />
        </Suspense>
      </div>
    </div>
  );
}
