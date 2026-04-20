'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { MapPin, Loader2, Search } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { AppSession } from '../../lib/auth';

export type LocationResult = {
  city: string;
  state: string;
  country: string;
};

export type LocationAutocompleteProps = {
  session: AppSession;
  initialValue?: string;
  onSelect: (location: LocationResult, rawText: string) => void;
  placeholder?: string;
};

export function LocationAutocomplete({ session, initialValue = '', onSelect, placeholder = 'Buscar cidade, estado, país...' }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initial query
  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Debounce effect para disparar API após 1s
  useEffect(() => {
    if (query.trim() === '' || query === initialValue) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      apiFetch(`/location/autocomplete?q=${encodeURIComponent(query)}`, { session })
        .then((res) => {
          setSuggestions((res as Record<string, unknown>).suggestions as Record<string, unknown>[] || []);
          setIsOpen(true);
        })
        .catch((err) => {
          console.error('Error fetching locations:', err);
        })
        .finally(() => setLoading(false));
    }, 1000); // 1 segundo conforme pedido

    return () => clearTimeout(timeout);
  }, [query, session]);

  const handleSelect = async (placeId: string, primaryText: string, fullText: string) => {
    setQuery(fullText); // Fill input visually
    setIsOpen(false);
    setLoading(true);
    try {
      // Buscar detalhes para separar as entidades
      const details = await apiFetch(`/location/details?placeId=${placeId}`, { session });
      
      let city = '';
      let state = '';
      let country = '';

      if (details?.addressComponents) {
        for (const component of details.addressComponents) {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            if (!city) city = component.shortText || component.longText;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.shortText || component.longText;
          }
          if (component.types.includes('country')) {
            country = component.longText;
          }
        }
      }

      // Fallback
      if (!city) city = primaryText;
      
      onSelect({ city, state, country }, fullText);
    } catch (e) {
      console.error(e);
      // Se falhar o details, tenta jogar o raw text
      onSelect({ city: primaryText, state: '', country: '' }, fullText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-white dark:bg-zinc-950 text-popover-foreground shadow-xl outline-none animate-in fade-in-0 zoom-in-95">
          <ul className="max-h-60 overflow-y-auto p-1">
            {suggestions.map((suggestion, idx) => {
              const sug = suggestion as Record<string, any>;
              const placeId = sug.placePrediction?.placeId || sug.placeId;
              const mainText = sug.placePrediction?.text?.text || (sug.description as string);
              return (
                <li
                  key={placeId || idx}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
                  onClick={() => handleSelect(placeId, mainText, mainText)}
                >
                  <MapPin className="mr-2.5 h-4 w-4 text-primary/60 shrink-0" />
                  <span className="truncate font-medium">{mainText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
