export const paths = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  tickets: '/tickets',
  createTicket: '/tickets/create',
  departments: '/departments',
  users: '/users',
  userCreate: '/users/new',
  userEdit: (id: string) => `/users/${id}/edit`,
  roles: '/roles',
  sla: '/sla',
  designations: '/designations',
  masters: '/masters',
  masterType: (type: string) => `/masters?type=${type}`,
  reports: '/reports',
} as const;

export interface NavItem {
  label: string;
  path: string;
}
