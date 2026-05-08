import React from 'react';

interface MapEmbedProps {
  destination: string;
}

export default function MapEmbed({ destination }: MapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-ink-50 rounded-2xl border border-ink-200 flex items-center justify-center">
        <p className="text-slate-500">Google Maps API Key not configured.</p>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(destination)}`;

  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-ink-200 shadow-soft">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={src}
      ></iframe>
    </div>
  );
}
