"use client";

import { CityOverview } from "@/lib/types";
import { MapPin } from "lucide-react";

interface CitySelectorProps {
  cities: CityOverview[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
}

export function CitySelector({ cities, selectedCityId, onSelectCity }: CitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800">
      {cities.map((city) => {
        const isSelected = city.id === selectedCityId;
        return (
          <button
            key={city.id}
            onClick={() => onSelectCity(city.id)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-200" : "text-slate-400"}`} />
            <span>{city.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border"
              style={{
                backgroundColor: `${city.aqi_color}20`,
                color: city.aqi_color,
                borderColor: `${city.aqi_color}50`
              }}
            >
              {city.latest_pm25.toFixed(1)} µg/m³
            </span>
          </button>
        );
      })}
    </div>
  );
}
