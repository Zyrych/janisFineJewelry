const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface QueryOptions {
  select?: string;
  eq?: Record<string, string>;
  limit?: number;
  single?: boolean;
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code: string } | null;
}

async function query<T>(
  table: string,
  options: QueryOptions = {},
  accessToken?: string
): Promise<QueryResult<T>> {
  const { select = '*', eq = {}, limit, single } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

  for (const [key, value] of Object.entries(eq)) {
    url += `&${key}=eq.${encodeURIComponent(value)}`;
  }

  if (limit) {
    url += `&limit=${limit}`;
  }

  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (single) {
    headers['Accept'] = 'application/vnd.pgrst.object+json';
  }

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        data: null,
        error: {
          message: errorData.message || 'Request failed',
          code: errorData.code || res.status.toString(),
        },
      };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'FETCH_ERROR',
      },
    };
  }
}

async function insert<T>(
  table: string,
  values: Record<string, unknown>,
  accessToken?: string
): Promise<QueryResult<T>> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        data: null,
        error: {
          message: errorData.message || 'Insert failed',
          code: errorData.code || res.status.toString(),
        },
      };
    }

    const data = await res.json();
    return { data: data[0] || data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'FETCH_ERROR',
      },
    };
  }
}

async function update<T>(
  table: string,
  values: Record<string, unknown>,
  eq: Record<string, string>,
  accessToken?: string
): Promise<QueryResult<T>> {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;

  for (const [key, value] of Object.entries(eq)) {
    url += `${key}=eq.${encodeURIComponent(value)}&`;
  }

  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        data: null,
        error: {
          message: errorData.message || 'Update failed',
          code: errorData.code || res.status.toString(),
        },
      };
    }

    const data = await res.json();
    return { data: data[0] || data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'FETCH_ERROR',
      },
    };
  }
}

async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  accessToken?: string
): Promise<{ url: string | null; error: { message: string } | null }> {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': file.type,
    'x-upsert': 'true',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: file,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Upload error:', errorData);
      return {
        url: null,
        error: { message: errorData.error || errorData.message || 'Upload failed' },
      };
    }

    // Return the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    return { url: publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    };
  }
}

export const db = {
  query,
  insert,
  update,
  uploadFile,
};
