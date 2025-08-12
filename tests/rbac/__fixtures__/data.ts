// Test fixtures for RBAC scope testing
export interface TestUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  providerId?: string;
  isActive: boolean;
}

export interface TestOrganization {
  id: string;
  name: string;
  type: 'client' | 'provider';
  isActive: boolean;
}

export interface TestProvider {
  id: string;
  name: string;
  organizationId: string;
  isActive: boolean;
}

export interface TestService {
  id: string;
  name: string;
  providerId: string;
  isActive: boolean;
}

export interface TestBooking {
  id: string;
  clientUserId: string;
  providerId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isActive: boolean;
}

export interface TestCompany {
  id: string;
  name: string;
  organizationId: string;
  isActive: boolean;
}

export interface TestPromoter {
  id: string;
  name: string;
  organizationId: string;
  isActive: boolean;
}

export interface TestParty {
  id: string;
  name: string;
  organizationId: string;
  isActive: boolean;
}

// Test Users
export const testUsers: TestUser[] = [
  // Client Users
  {
    id: 'client-basic-1',
    email: 'basic.client@example.com',
    role: 'Basic Client',
    organizationId: 'org-client-1',
    isActive: true,
  },
  {
    id: 'client-premium-1',
    email: 'premium.client@example.com',
    role: 'Premium Client',
    organizationId: 'org-client-1',
    isActive: true,
  },
  {
    id: 'client-enterprise-1',
    email: 'enterprise.client@example.com',
    role: 'Enterprise Client',
    organizationId: 'org-client-2',
    isActive: true,
  },
  {
    id: 'client-admin-1',
    email: 'client.admin@example.com',
    role: 'Client Administrator',
    organizationId: 'org-client-1',
    isActive: true,
  },

  // Provider Users
  {
    id: 'provider-individual-1',
    email: 'individual.provider@example.com',
    role: 'Individual Provider',
    providerId: 'provider-ind-1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-team-1',
    email: 'team.member@example.com',
    role: 'Provider Team Member',
    providerId: 'provider-team-1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-manager-1',
    email: 'provider.manager@example.com',
    role: 'Provider Manager',
    providerId: 'provider-manager-1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-admin-1',
    email: 'provider.admin@example.com',
    role: 'Provider Administrator',
    providerId: 'provider-admin-1',
    organizationId: 'org-provider-1',
    isActive: true,
  },

  // Admin Users
  {
    id: 'admin-support-1',
    email: 'support.agent@example.com',
    role: 'Support Agent',
    isActive: true,
  },
  {
    id: 'admin-moderator-1',
    email: 'content.moderator@example.com',
    role: 'Content Moderator',
    isActive: true,
  },
  {
    id: 'admin-platform-1',
    email: 'platform.admin@example.com',
    role: 'Platform Administrator',
    isActive: true,
  },
  {
    id: 'admin-system-1',
    email: 'system.admin@example.com',
    role: 'System Administrator',
    isActive: true,
  },
];

// Test Organizations
export const testOrganizations: TestOrganization[] = [
  {
    id: 'org-client-1',
    name: 'Client Organization 1',
    type: 'client',
    isActive: true,
  },
  {
    id: 'org-client-2',
    name: 'Client Organization 2',
    type: 'client',
    isActive: true,
  },
  {
    id: 'org-provider-1',
    name: 'Provider Organization 1',
    type: 'provider',
    isActive: true,
  },
  {
    id: 'org-provider-2',
    name: 'Provider Organization 2',
    type: 'provider',
    isActive: true,
  },
];

// Test Providers
export const testProviders: TestProvider[] = [
  {
    id: 'provider-ind-1',
    name: 'Individual Provider 1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-team-1',
    name: 'Provider Team 1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-manager-1',
    name: 'Provider Manager 1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-admin-1',
    name: 'Provider Admin 1',
    organizationId: 'org-provider-1',
    isActive: true,
  },
  {
    id: 'provider-other-1',
    name: 'Other Provider 1',
    organizationId: 'org-provider-2',
    isActive: true,
  },
];

// Test Services
export const testServices: TestService[] = [
  {
    id: 'service-1',
    name: 'Service 1',
    providerId: 'provider-ind-1',
    isActive: true,
  },
  {
    id: 'service-2',
    name: 'Service 2',
    providerId: 'provider-team-1',
    isActive: true,
  },
  {
    id: 'service-3',
    name: 'Service 3',
    providerId: 'provider-manager-1',
    isActive: true,
  },
  {
    id: 'service-4',
    name: 'Service 4',
    providerId: 'provider-other-1',
    isActive: true,
  },
];

// Test Bookings
export const testBookings: TestBooking[] = [
  {
    id: 'booking-1',
    clientUserId: 'client-basic-1',
    providerId: 'provider-ind-1',
    serviceId: 'service-1',
    status: 'confirmed',
    isActive: true,
  },
  {
    id: 'booking-2',
    clientUserId: 'client-premium-1',
    providerId: 'provider-team-1',
    serviceId: 'service-2',
    status: 'pending',
    isActive: true,
  },
  {
    id: 'booking-3',
    clientUserId: 'client-enterprise-1',
    providerId: 'provider-other-1',
    serviceId: 'service-4',
    status: 'completed',
    isActive: true,
  },
];

// Test Companies
export const testCompanies: TestCompany[] = [
  {
    id: 'company-1',
    name: 'Company 1',
    organizationId: 'org-client-1',
    isActive: true,
  },
  {
    id: 'company-2',
    name: 'Company 2',
    organizationId: 'org-client-2',
    isActive: true,
  },
  {
    id: 'company-3',
    name: 'Company 3',
    organizationId: 'org-provider-1',
    isActive: true,
  },
];

// Test Promoters
export const testPromoters: TestPromoter[] = [
  {
    id: 'promoter-1',
    name: 'Promoter 1',
    organizationId: 'org-client-1',
    isActive: true,
  },
  {
    id: 'promoter-2',
    name: 'Promoter 2',
    organizationId: 'org-client-2',
    isActive: true,
  },
  {
    id: 'promoter-3',
    name: 'Promoter 3',
    organizationId: 'org-provider-1',
    isActive: true,
  },
];

// Test Parties
export const testParties: TestParty[] = [
  {
    id: 'party-1',
    name: 'Party 1',
    organizationId: 'org-client-1',
    isActive: true,
  },
  {
    id: 'party-2',
    name: 'Party 2',
    organizationId: 'org-client-2',
    isActive: true,
  },
  {
    id: 'party-3',
    name: 'Party 3',
    organizationId: 'org-provider-1',
    isActive: true,
  },
];

// Helper functions for test data
export const getTestUser = (id: string): TestUser | undefined => {
  return testUsers.find(user => user.id === id);
};

export const getTestUserByRole = (role: string): TestUser | undefined => {
  return testUsers.find(user => user.role === role);
};

export const getTestOrganization = (
  id: string
): TestOrganization | undefined => {
  return testOrganizations.find(org => org.id === id);
};

export const getTestProvider = (id: string): TestProvider | undefined => {
  return testProviders.find(provider => provider.id === id);
};

export const getTestService = (id: string): TestService | undefined => {
  return testServices.find(service => service.id === id);
};

export const getTestBooking = (id: string): TestBooking | undefined => {
  return testBookings.find(booking => booking.id === id);
};

export const getTestCompany = (id: string): TestCompany | undefined => {
  return testCompanies.find(company => company.id === id);
};

export const getTestPromoter = (id: string): TestPromoter | undefined => {
  return testPromoters.find(promoter => promoter.id === id);
};

export const getTestParty = (id: string): TestParty | undefined => {
  return testParties.find(party => party.id === id);
};

// Test context builders
export const buildTestContext = (
  userId: string,
  resourceId?: string,
  resourceType?: string
) => {
  const user = getTestUser(userId);
  if (!user) {
    throw new Error(`Test user not found: ${userId}`);
  }

  const context: any = {
    user,
    params: resourceId ? { id: resourceId } : {},
    resourceType,
  };

  // Add organization context
  if (user.organizationId) {
    context.organization = getTestOrganization(user.organizationId);
  }

  // Add provider context
  if (user.providerId) {
    context.provider = getTestProvider(user.providerId);
  }

  return context;
};

// Permission test scenarios
export const permissionTestScenarios = [
  {
    name: 'User viewing own profile',
    user: 'client-basic-1',
    permission: 'user:view:own',
    resourceId: 'client-basic-1',
    resourceType: 'user',
    expectedResult: true,
  },
  {
    name: 'User viewing other user profile',
    user: 'client-basic-1',
    permission: 'user:view:own',
    resourceId: 'client-premium-1',
    resourceType: 'user',
    expectedResult: false,
  },
  {
    name: 'Provider viewing own service',
    user: 'provider-individual-1',
    permission: 'service:view:own',
    resourceId: 'service-1',
    resourceType: 'service',
    expectedResult: true,
  },
  {
    name: 'Provider viewing other provider service',
    user: 'provider-individual-1',
    permission: 'service:view:own',
    resourceId: 'service-4',
    resourceType: 'service',
    expectedResult: false,
  },
  {
    name: 'Client viewing own booking',
    user: 'client-basic-1',
    permission: 'booking:view:own',
    resourceId: 'booking-1',
    resourceType: 'booking',
    expectedResult: true,
  },
  {
    name: 'Client viewing other client booking',
    user: 'client-basic-1',
    permission: 'booking:view:own',
    resourceId: 'booking-2',
    resourceType: 'booking',
    expectedResult: false,
  },
  {
    name: 'Provider viewing provider booking',
    user: 'provider-individual-1',
    permission: 'booking:view:provider',
    resourceId: 'booking-1',
    resourceType: 'booking',
    expectedResult: true,
  },
  {
    name: 'Provider viewing other provider booking',
    user: 'provider-individual-1',
    permission: 'booking:view:provider',
    resourceId: 'booking-3',
    resourceType: 'booking',
    expectedResult: false,
  },
  {
    name: 'User viewing organization company',
    user: 'client-basic-1',
    permission: 'company:view:organization',
    resourceId: 'company-1',
    resourceType: 'company',
    expectedResult: true,
  },
  {
    name: 'User viewing other organization company',
    user: 'client-basic-1',
    permission: 'company:view:organization',
    resourceId: 'company-2',
    resourceType: 'company',
    expectedResult: false,
  },
  {
    name: 'Admin viewing all users',
    user: 'admin-platform-1',
    permission: 'user:read:all',
    resourceId: 'client-basic-1',
    resourceType: 'user',
    expectedResult: true,
  },
  {
    name: 'Non-admin viewing all users',
    user: 'client-basic-1',
    permission: 'user:read:all',
    resourceId: 'client-premium-1',
    resourceType: 'user',
    expectedResult: false,
  },
];
