export const ROLES = {
  super_admin: { description: "Administrateur plateforme", permissions: ["*"] },
  owner: {
    description: "Propriétaire de la pharmacie",
    permissions: ["pharmacy:manage", "users:manage", "billing:manage", "reports:view", "inventory:manage", "products:manage", "sales:manage", "shop:manage", "settings:manage"],
  },
  pharmacist: {
    description: "Pharmacien diplômé",
    permissions: ["sales:create", "inventory:view", "products:view", "orders:manage", "prescriptions:validate", "inter_pharmacy:request"],
  },
  cashier: {
    description: "Caissier",
    permissions: ["sales:create", "products:view", "cash_register:manage", "customers:view"],
  },
  customer: {
    description: "Client",
    permissions: ["shop:browse", "orders:own", "reminders:own", "ai_assistant:use", "inter_pharmacy:view_map"],
  },
} as const;

export const BILLING_PLANS = {
  free: { name: "Gratuit", price: 0, users: 2, products: 100, monthlyOrders: 50, onlineShop: false, aiAssistant: false },
  starter: { name: "Starter", priceMonthly: 9900, priceYearly: 89000, users: 5, products: 500, monthlyOrders: 500, onlineShop: true, aiAssistant: 100 },
  pro: { name: "Pro", priceMonthly: 24900, priceYearly: 220000, users: 20, products: Infinity, monthlyOrders: Infinity, onlineShop: true, aiAssistant: Infinity },
  enterprise: { name: "Entreprise", price: "Sur devis", users: Infinity, products: Infinity, monthlyOrders: Infinity, whiteLabel: true, apiAccess: true },
} as const;
