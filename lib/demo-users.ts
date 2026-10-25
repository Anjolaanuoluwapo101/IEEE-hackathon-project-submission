import type { Role } from "./data";

export type DemoUser = {
  id: string;
  name: string;
  role: Role;
  org: string;
  area: string;
  walletAddress: string;
};

export const DEMO_ACCOUNTS: DemoUser[] = [
  {
    id: "picker-001",
    name: "Adeola Bakare",
    role: "picker",
    org: "Independent pickers",
    area: "Ikeja",
    walletAddress: "0x1000000000000000000000000000000000000001",
  },
  {
    id: "picker-002",
    name: "Chinedu Okeke",
    role: "picker",
    org: "Independent pickers",
    area: "Yaba",
    walletAddress: "0x1000000000000000000000000000000000000002",
  },
  {
    id: "picker-003",
    name: "Fatima Sule",
    role: "picker",
    org: "Independent pickers",
    area: "Surulere",
    walletAddress: "0x1000000000000000000000000000000000000003",
  },
  {
    id: "agg-001",
    name: "Lagos Recycling Hub",
    role: "aggregator",
    org: "Lagos Recycling Hub",
    area: "Ikeja",
    walletAddress: "0x2000000000000000000000000000000000000001",
  },
  {
    id: "agg-002",
    name: "Eko Circular Collective",
    role: "aggregator",
    org: "Eko Circular Collective",
    area: "Oshodi",
    walletAddress: "0x2000000000000000000000000000000000000002",
  },
  {
    id: "rec-001",
    name: "GreenLoop Recyclers",
    role: "recycler",
    org: "GreenLoop Recyclers",
    area: "Apapa",
    walletAddress: "0x3000000000000000000000000000000000000001",
  },
  {
    id: "rec-002",
    name: "ReVive Materials",
    role: "recycler",
    org: "ReVive Materials",
    area: "Agbara",
    walletAddress: "0x3000000000000000000000000000000000000002",
  },
  {
    id: "prod-001",
    name: "Nestle Nigeria",
    role: "producer",
    org: "Nestle Nigeria",
    area: "Agbara",
    walletAddress: "0x4000000000000000000000000000000000000001",
  },
  {
    id: "prod-002",
    name: "Coca-Cola HBC",
    role: "producer",
    org: "Coca-Cola HBC",
    area: "Ikeja",
    walletAddress: "0x4000000000000000000000000000000000000002",
  },
];

export const DEMO_PICKERS: DemoUser[] = DEMO_ACCOUNTS.filter(
  (user) => user.role === "picker"
);
export const DEMO_AGGREGATORS: DemoUser[] = DEMO_ACCOUNTS.filter(
  (user) => user.role === "aggregator"
);
export const DEMO_RECYCLERS: DemoUser[] = DEMO_ACCOUNTS.filter(
  (user) => user.role === "recycler"
);
export const DEMO_PRODUCERS: DemoUser[] = DEMO_ACCOUNTS.filter(
  (user) => user.role === "producer"
);

export function findDemoUser(users: DemoUser[], id: string): DemoUser | null {
  return users.find((user) => user.id === id) ?? null;
}

export function findDemoAccount(id: string): DemoUser | null {
  return findDemoUser(DEMO_ACCOUNTS, id);
}

export function demoAccountsByRole(role: Role): DemoUser[] {
  return DEMO_ACCOUNTS.filter((user) => user.role === role);
}
