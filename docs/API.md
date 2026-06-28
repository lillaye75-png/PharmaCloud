# PharmaCloud API Documentation

Base URL: `http://localhost:8001/api/v1`

## Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion |
| POST | `/auth/register` | Inscription |
| POST | `/auth/refresh` | Rafraîchir token |
| GET | `/auth/me` | Infos utilisateur |

## Tenant
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/tenant/me` | Infos pharmacie |
| PUT | `/tenant/me` | Modifier pharmacie |
| POST | `/tenant/logo` | Upload logo |

## Produits
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/products/` | Liste produits |
| POST | `/products/` | Créer produit |
| GET | `/products/{id}` | Détail produit |
| PUT | `/products/{id}` | Modifier produit |
| DELETE | `/products/{id}` | Supprimer produit |
| GET | `/products/search?q=` | Rechercher |
| GET | `/products/alerts/low-stock` | Stock faible |
| GET | `/products/alerts/expiry?days=30` | Péremption |

## Ventes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/sales/` | Liste ventes |
| POST | `/sales/` | Créer vente |
| GET | `/sales/{id}` | Détail vente |
| PUT | `/sales/{id}` | Modifier vente |
| DELETE | `/sales/{id}` | Supprimer vente |
| GET | `/sales/{id}/items` | Articles d'une vente |
| GET | `/sales/report?period=today` | Rapport ventes |

## Commandes (Boutique)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/orders/` | Liste commandes |
| PUT | `/orders/{id}/status` | Changer statut |

## Paiements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/payments/initiate` | Initier paiement |
| GET | `/payments/methods` | Méthodes disponibles |

## Réseau Inter-Pharmacies
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/network/pharmacies` | Liste pharmacies |
| GET | `/network/requests` | Mes demandes |
| POST | `/network/requests` | Créer demande |

## Rapports
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/reports/sales?period=` | Rapport ventes |
| GET | `/reports/inventory` | État stock |
| GET | `/reports/sales/export/csv?period=` | Export CSV |
| GET | `/reports/sales/export/pdf?period=` | Export PDF |

## AI
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/ai/chat` | Assistant IA |
| POST | `/ai/analyze-prescription` | Analyser ordonnance |
| POST | `/ai/stock-insights` | Insights stock |

## Shop (Public)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/shop/{slug}` | Infos boutique |
| GET | `/shop/{slug}/products` | Produits boutique |
| POST | `/shop/{slug}/orders` | Commander |

## Excel
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/excel/products/import` | Importer CSV |
| GET | `/excel/products/export` | Exporter CSV |
