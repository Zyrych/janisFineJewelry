import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

const ALL_ROLES = ['customer', 'admin', 'superuser'];

export default function AdminUsers() {
  const { session, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(ALL_ROLES);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    fetchUsers();
  }, [session?.access_token]);

  async function fetchUsers() {
    if (!session?.access_token) return;

    const { data, error } = await db.query<User[]>('users', {
      select: '*',
    }, session.access_token);

    if (error) {
      console.error('Failed to fetch users:', error);
    } else {
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setUsers(sorted);
    }
    setLoading(false);
  }

  const updateUserRole = async (userId: string, newRole: 'customer' | 'admin' | 'superuser') => {
    if (!session?.access_token) return;

    await db.update('users', { role: newRole }, { id: userId }, session.access_token);
    fetchUsers();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-stone-100 text-stone-700',
      admin: 'bg-blue-100 text-blue-700',
      superuser: 'bg-purple-100 text-purple-700',
    };
    return colors[role] || 'bg-stone-100 text-stone-700';
  };

  const filteredUsers = users.filter((user) => {
    // Role filter
    const roleMatch = selectedRoles.length === ALL_ROLES.length || selectedRoles.includes(user.role);

    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return roleMatch;

    const searchMatch =
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query);

    return roleMatch && searchMatch;
  });

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const selectAll = () => setSelectedRoles(ALL_ROLES);
  const clearAll = () => setSelectedRoles([]);

  const formatRole = (role: string) => {
    if (role === 'superuser') return 'Super User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getFilterLabel = () => {
    if (selectedRoles.length === ALL_ROLES.length) return 'All Roles';
    if (selectedRoles.length === 0) return 'None Selected';
    if (selectedRoles.length === 1) return formatRole(selectedRoles[0]);
    return `${selectedRoles.length} Selected`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-[#5C4A3A] to-[#8B7355] text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link to="/admin" className="text-white/80 hover:text-white">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold font-serif">Users</h1>
          <div className="w-10" />
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
              placeholder="Search by name, email, or phone..."
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
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 rounded border-stone-300 text-[#B8956B] focus:ring-[#B8956B]"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(role)}`}>
                      {formatRole(role)}
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
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}

        {loading ? (
          <div className="text-center text-[#8B7355] py-8">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-[#8B7355] py-8">No users found</div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-xl p-4 shadow-sm ${isCurrentUser ? 'ring-2 ring-[#B8956B]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#5C4A3A]">{user.full_name}</p>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-[#B8956B] text-white text-xs rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[#8B7355] text-sm">{user.email}</p>
                      {user.phone && (
                        <p className="text-[#8B7355]/70 text-xs">{user.phone}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>

                  <p className="text-[#8B7355]/60 text-xs mb-3">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>

                  <div className="pt-3 border-t border-stone-100">
                    <label className="block text-sm text-[#5C4A3A] font-medium mb-1">Change Role</label>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'customer' | 'admin' | 'superuser')}
                      disabled={isCurrentUser}
                      className={`w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8956B] focus:border-transparent ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="superuser">Super User</option>
                    </select>
                    {isCurrentUser && (
                      <p className="text-[#8B7355] text-xs mt-1">You cannot change your own role</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
