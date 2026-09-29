"use client";

import { CityOverview } from "@/lib/types";
import { Navigation2 } from "lucide-react";

interface SpatialMapProps {
  cities: CityOverview[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
}

export function SpatialMap({ cities, selectedCityId, onSelectCity }: SpatialMapProps) {
  // Bounding box for Jabodetabek:
  // Lat: -6.70 (Bogor south) to -6.10 (North Jakarta coast)
  // Lon: 106.55 (Tangerang west) to 107.10 (East Bekasi)
  const minLat = -6.75;
  const maxLat = -6.08;
  const minLon = 106.52;
  const maxLon = 107.12;

  // Convert lat/lon to percentage in SVG viewBox
  const getCoordinates = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x, y };
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Navigation2 className="w-4 h-4 text-cyan-400" />
            Distribusi Spasial Stasiun Pemantauan PM2.5
          </h3>
          <p className="text-xs text-slate-400">
            Jaringan 5 Titik Sensor Spasial-Temporal Jabodetabek (Open-Meteo Air Quality)
          </p>
        </div>
        <div className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
          Radius: ~50 km
        </div>
      </div>

      {/* SVG Stylized Map Canvas */}
      <div className="relative w-full h-64 bg-slate-950/80 rounded-xl border border-slate-850 p-2 overflow-hidden flex items-center justify-center">
        {/* Radar concentric circular grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#38bdf8" strokeDasharray="3 3" />
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#38bdf8" strokeDasharray="3 3" />
          <circle cx="50%" cy="50%" r="60%" fill="none" stroke="#38bdf8" strokeDasharray="3 3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#38bdf8" strokeDasharray="2 2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#38bdf8" strokeDasharray="2 2" />
        </svg>

        {/* Spatial interconnection lines from Jakarta to suburban clusters */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {cities.map((city) => {
            const jkt = cities.find((c) => c.id === "jakarta");
            if (!jkt || city.id === "jakarta") return null;
            const p1 = getCoordinates(jkt.latitude, jkt.longitude);
            const p2 = getCoordinates(city.latitude, city.longitude);
            return (
              <line
                key={`line-${city.id}`}
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            );
          })}
        </svg>

        {/* City Station Interactive Nodes */}
        {cities.map((city) => {
          const { x, y } = getCoordinates(city.latitude, city.longitude);
          const isSelected = city.id === selectedCityId;

          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city.id)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-10 flex flex-col items-center focus:outline-none`}
            >
              {/* Outer pulsing ring */}
              <span
                className={`absolute w-8 h-8 rounded-full animate-ping opacity-30`}
                style={{ backgroundColor: city.aqi_color }}
              />

              {/* Core Node Marker */}
              <div
                className={`relative w-5 h-5 rounded-full flex items-center justify-center border-2 transition-transform ${
                  isSelected
                    ? "scale-125 ring-4 ring-cyan-400/50"
                    : "group-hover:scale-110"
                }`}
                style={{
                  backgroundColor: city.aqi_color,
                  borderColor: "#ffffff"
                }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Station Label & Bubble */}
              <div
                className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-lg border transition ${
                  isSelected
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500 ring-1 ring-cyan-400"
                    : "bg-slate-900/90 text-slate-200 border-slate-700 group-hover:border-slate-500"
                }`}
              >
                {city.name} ({city.latest_pm25.toFixed(1)})
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Baik (&le;15.5)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Sedang (15.6-55.4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tdk Sehat (55.5-150.4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Sgt Tdk Sehat (&gt;150)
          </span>
        </div>
        <div className="italic text-slate-500">Satuan: µg/m³ (ISPU KLHK)</div>
      </div>
    </div>
  );
}
