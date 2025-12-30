import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { useCart } from '../contexts/CartContext';
import type { Live } from '../types';

export default function Lives() {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const { totalItems } = useCart();

  useEffect(() => {
    async function fetchLives() {
      const { data, error } = await db.query<Live[]>('lives', {
        select: '*',
      });

      if (error) {
        console.error('Failed to fetch lives:', error);
      } else {
        // Sort: live first, then upcoming by date, then ended by date desc
        const sorted = (data || []).sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          if (a.status === 'upcoming' && b.status === 'ended') return -1;
          if (b.status === 'upcoming' && a.status === 'ended') return 1;
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
        });
        setLives(sorted);
      }
      setLoading(false);
    }

    fetchLives();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return (
        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
          LIVE NOW
        </span>
      );
    }
    if (status === 'upcoming') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
        Ended
      </span>
    );
  };

  const liveLives = lives.filter((l) => l.status === 'live');
  const upcomingLives = lives.filter((l) => l.status === 'upcoming');
  const endedLives = lives.filter((l) => l.status === 'ended');

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/" className="text-[#B8956B] font-medium">
            &larr; Home
          </Link>
          <h1 className="text-lg font-semibold text-[#5C4A3A]">Live Sessions</h1>
          <Link to="/cart" className="text-[#B8956B] relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#B8956B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center text-[#8B7355] py-12">Loading...</div>
        ) : lives.length === 0 ? (
          <div className="text-center text-[#8B7355] py-12">
            <p>No live sessions yet.</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Now */}
            {liveLives.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#5C4A3A] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Live Now
                </h2>
                <div className="space-y-3">
                  {liveLives.map((live) => (
                    <LiveCard key={live.id} live={live} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingLives.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#5C4A3A] mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingLives.map((live) => (
                    <LiveCard key={live.id} live={live} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Lives */}
            {endedLives.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#5C4A3A] mb-3">Previous Lives</h2>
                <div className="space-y-3">
                  {endedLives.map((live) => (
                    <LiveCard key={live.id} live={live} formatDate={formatDate} getStatusBadge={getStatusBadge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LiveCard({
  live,
  formatDate,
  getStatusBadge,
}: {
  live: Live;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  return (
    <Link
      to={`/lives/${live.slug}`}
      className={`block bg-white rounded-xl shadow-sm overflow-hidden ${
        live.status === 'live' ? 'ring-2 ring-red-500' : ''
      }`}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] relative">
        {live.cover_image ? (
          <img src={live.cover_image} alt={live.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge(live.status)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#5C4A3A] mb-1">{live.title}</h3>
        <p className="text-sm text-[#8B7355]">{formatDate(live.scheduled_at)}</p>
        <div className="mt-3 flex items-center text-[#B8956B] text-sm font-medium">
          {live.status === 'live' ? 'Join Now' : live.status === 'upcoming' ? 'View Details' : 'Browse Products'}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
