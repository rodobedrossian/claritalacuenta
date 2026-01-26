import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import localforage from 'localforage';

// Configurar localforage (IndexedDB)
localforage.config({
  name: 'clarita_cuenta',
  storeName: 'query_cache',
  description: 'Cache de consultas de React Query para Clarita la Cuenta'
});

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => localforage.getItem(key),
    setItem: (key, value) => localforage.setItem(key, value),
    removeItem: (key) => localforage.removeItem(key),
  },
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});
