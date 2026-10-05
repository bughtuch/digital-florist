// src/components/studio/BloomListClient.tsx

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { DbCity } from '@/types';

type BloomRow = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'available' | 'archived';
  archive_code: string;
  edition_sold: number;
  edition_total: number;
  display_order: number;
  year: number;
  featured: boolean;
  city: { name: string; code: string } | null;
  collection: { name: string; slug: string } | null;
};

type StatusFilter = 'all' | 'draft' | 'available' | 'archived';

interface BloomListClientProps {
  blooms: BloomRow[];
  cities: DbCity[];
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
  { value: 'archived', label: 'Archived' },
];

function statusClass(status: BloomRow['status']) {
  if (status === 'available') return 'text-df-muted';
  if (status === 'archived') return 'text-df-faint line-through';
  return 'text-df-faint'; // draft
}

export default function BloomListClient({
  blooms,
  cities,
}: BloomListClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return blooms.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (cityFilter !== 'all' && b.city?.code !== cityFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !b.title.toLowerCase().includes(q) &&
          !b.archive_code.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [blooms, statusFilter, cityFilter, search]);

  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[9px] tracking-[0.3em] text-df-faint uppercase mb-2">
            Studio
          </p>
          <h1 className="font-display text-[28px] tracking-[0.08em] text-df-text uppercase">
            Blooms
          </h1>
        </div>
        <Link
          href="/studio/blooms/new"
          className="border border-df-text px-5 py-2 text-[10px] tracking-[0.18em] text-df-text uppercase hover:bg-df-text hover:text-df-black transition-all duration-300"
        >
          New Bloom →
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-6 mb-6 border-b border-df-border pb-5">
        {/* Status tabs */}
        <div className="flex items-center gap-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 text-[9px] tracking-[0.18em] uppercase transition-colors duration-200 border-r border-df-border first:border-l border-t border-b ${
                statusFilter === tab.value
                  ? 'bg-df-surface text-df-text border-df-border'
                  : 'bg-transparent text-df-faint hover:text-df-muted border-df-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="bg-df-surface border border-df-border px-3 py-1.5 text-[11px] text-df-muted focus:outline-none focus:border-df-muted rounded-none"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or archive code…"
          className="bg-df-surface border border-df-border px-3 py-1.5 text-[11px] text-df-muted placeholder:text-df-faint focus:outline-none focus:border-df-muted rounded-none w-64"
        />

        <span className="ml-auto text-[9px] tracking-[0.1em] text-df-faint">
          {filtered.length} bloom{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="border-t border-df-border">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_1.5fr_0.5fr_0.5fr_0.5fr] gap-4 py-2 border-b border-df-border">
          {[
            'Title',
            'City',
            'Archive Code',
            'Status',
            'Edition',
            'Collection',
            'Year',
            'Feat.',
            '',
          ].map((col, i) => (
            <span
              key={i}
              className="text-[9px] tracking-[0.2em] text-df-faint uppercase"
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[11px] tracking-[0.1em] text-df-faint uppercase">
              No blooms found.
            </p>
          </div>
        ) : (
          filtered.map((bloom) => (
            <div
              key={bloom.id}
              className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_1.5fr_0.5fr_0.5fr_0.5fr] gap-4 py-3 border-b border-df-border hover:bg-df-surface transition-colors duration-150 items-center"
            >
              <span className="text-[12px] text-df-text truncate">
                {bloom.title}
              </span>
              <span className="text-[11px] text-df-muted">
                {bloom.city?.code ?? '—'}
              </span>
              <span className="text-[11px] text-df-muted font-mono">
                {bloom.archive_code}
              </span>
              <span
                className={`text-[9px] tracking-[0.18em] uppercase ${statusClass(bloom.status)}`}
              >
                {bloom.status}
              </span>
              <span className="text-[11px] text-df-muted">
                {bloom.edition_sold} / {bloom.edition_total}
              </span>
              <span className="text-[11px] text-df-faint truncate">
                {bloom.collection?.name ?? '—'}
              </span>
              <span className="text-[11px] text-df-faint">{bloom.year}</span>
              <span className="text-[11px] text-df-faint">
                {bloom.featured ? '●' : ''}
              </span>
              <Link
                href={`/studio/blooms/${bloom.id}`}
                className="text-[9px] tracking-[0.15em] text-df-muted uppercase hover:text-df-text transition-colors duration-200 text-right"
              >
                Edit →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
