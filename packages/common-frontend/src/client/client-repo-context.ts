import { createContext, useContext } from 'react';
import type { AdminClientRepository, ClientRepository } from './api-repository-interface';

export const ClientRepoContext = createContext<ClientRepository | null>(null);
export const ClientRepoProvider = ClientRepoContext.Provider;
export const useClientRepo = (): ClientRepository => {
  const repo = useContext(ClientRepoContext);
  if (!repo) throw new Error('ClientRepoContext not provided');
  return repo;
};


export const AdminRepoContext = createContext<AdminClientRepository | null>(null);
export const AdminRepoProvider = AdminRepoContext.Provider;
/** The admin repository, or null in an app that has none. */
export const useOptionalAdminRepo = (): AdminClientRepository | null => useContext(AdminRepoContext);
export const useAdminRepo = (): AdminClientRepository => {
  const repo = useContext(AdminRepoContext);
  if (!repo) throw new Error('AdminRepoContext not provided');
  return repo;
};
