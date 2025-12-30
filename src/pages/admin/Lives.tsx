import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { Live, LiveStatus } from '../../types';

const ALL_STATUSES: LiveStatus[] = ['upcoming', 'live', 'ended'];

export default function AdminLives() {
  const { session } = useAuth();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<LiveStatus[]>(ALL_STATUSES);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLives();
  }, [session?.access_token]);

  async function fetchLives() {
    if (!session?.access_token) return;

    const { data, error } = await db.query<Live[]>('lives', {
      select: '*',
    }, session.access_token);

    if (error) {
      console.error('Failed to fetch lives:', error);
    } else {
      const sorted = (data || []).sort(
        (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );
      setLives(sorted);
    }
    setLoading(false);
  }

  const updateLiveStatus = async (liveId: string, newStatus: LiveStatus) => {
    if (!session?.access_token) return;

    await db.update('lives', { status: newStatus }, { id: liveId }, session.access_token);
    setLives((prev) =>
      prev.map((live) =>
        live.id === liveId ? { ...live, status: newStatus } : live
      )
    );
  };

  const getStatusColor = (status: LiveStatus) => {
    const colors: Record<LiveStatus, string> = {
      upcoming: 'bg-blue-100 text-blue-700',
      live: 'bg-red-100 text-red-700',
      ended: 'bg-stone-100 text-stone-700',
    };
    return colors[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const filteredLives = lives.filter((live) => {
    const statusMatch = selectedStatuses.length === ALL_STATUSES.length || selectedStatuses.includes(live.status);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;
    const searchMatch = live.title.toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });

  const toggleStatus = (status: LiveStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const selectAll = () => setSelectedStatuses([...ALL_STATUSES]);
  const clearAll = () => setSelectedStatuses([]);

  const getFilterLabel = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) return 'All Statuses';
    if (selectedStatuses.length === 0) return 'None Selected';
    if (selectedStatuses.length === 1) return selectedStatuses[0].charAt(0).toUpperCase() + selectedStatuses[0].slice(1);
    return `${selectedStatuses.length} Selected`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">Lives</h1>
          <Link
            to="/admin/lives/new"
            className="text-white/80 hover:text-white text-sm"
          >
            + New
          </Link>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search lives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-stone-200 text-[#5C4A3A] placeholder-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#5C4A3A]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-stone-200 text-[#5C4A3A] font-medium shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {getFilterLabel()}
            </span>
            <svg className={`w-5 h-5 text-[#8B7355] transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg z-20 p-3">
              <div className="flex justify-between mb-2 pb-2 border-b border-stone-100">
                <button onClick={selectAll} className="text-sm text-[#B8956B] font-medium hover:underline">
                  Select All
                </button>
                <button onClick={clearAll} className="text-sm text-[#8B7355] font-medium hover:underline">
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {ALL_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(status)}`}>
                      {status === 'live' ? 'Live Now' : status}
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={() => setFilterOpen(false)} className="w-full mt-3 pt-2 border-t border-stone-100 text-sm text-[#5C4A3A] font-medium">
                Done
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-[#8B7355] text-sm mb-3">
            Showing {filteredLives.length} of {lives.length} lives
          </p>
        )}

        {loading ? (
          <div className="text-center text-[#8B7355] py-8">Loading lives...</div>
        ) : filteredLives.length === 0 ? (
          <div className="text-center text-[#8B7355] py-8">
            <p>No lives found</p>
            <Link to="/admin/lives/new" className="text-[#B8956B] text-sm mt-2 underline block">
              Create your first live
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLives.map((live) => (
              <div key={live.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex gap-3">
                  {/* Cover Image */}
                  <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {live.cover_image ? (
                      <img src={live.cover_image} alt={live.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-[#5C4A3A] text-sm truncate">{live.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusColor(live.status)}`}>
                        {live.status === 'live' ? 'Live Now' : live.status}
                      </span>
                    </div>
                    <p className="text-[#8B7355] text-xs mt-1">{formatDate(live.scheduled_at)}</p>
                    {live.facebook_link ? (
                      <a
                        href={live.facebook_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#B8956B] text-xs hover:underline mt-1 block truncate"
                      >
                        Facebook Link
                      </a>
                    ) : (
                      <span className="text-[#8B7355] text-xs mt-1 block">No link yet</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="flex gap-2 mb-2">
                    <Link
                      to={`/admin/lives/${live.id}`}
                      className="flex-1 bg-[#B8956B] text-white py-2 rounded-xl text-sm font-medium text-center hover:bg-[#A6845D]"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/lives/${live.slug}`}
                      target="_blank"
                      className="flex-1 bg-stone-100 text-[#5C4A3A] py-2 rounded-xl text-sm font-medium text-center"
                    >
                      View Page
                    </Link>
                  </div>
                  <select
                    value={live.status}
                    onChange={(e) => updateLiveStatus(live.id, e.target.value as LiveStatus)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live Now</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
