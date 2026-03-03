import {
  SUPER_ADMIN_ID,
  SUPER_ADMIN_PHONE,
  SUPER_ADMIN_PROVIDER_NAME,
  SUPER_ADMIN_USERNAME,
} from "@/lib/authStorage";
import type { Product } from "@/types/product";

const STORAGE_KEY = "gusstore_products_v1";
const ANNOUNCEMENT_STORAGE_KEY = "gusstore_announcement_v1";
const CATEGORIES_STORAGE_KEY = "gusstore_categories_v1";
const BASE_WHATSAPP_DOMAIN = "https://wa.me";
const DEFAULT_ANNOUNCEMENT = "🔥 Ofertas activas hoy: entrega rápida y soporte directo por WhatsApp";
const DEFAULT_CATEGORIES = ["Streaming", "Gaming", "Música"];

// Imágenes por defecto
const netstreamImage = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500";
const cineplusImage = "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500";
const freefireImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500";
const soundmaxImage = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500";

export const createWhatsAppUrl = (productName: string, productPrice: number, ownerPhone: string, ownerName?: string) => {
  const safePhone = ownerPhone?.replace(/\D/g, "") || SUPER_ADMIN_PHONE;

  let cleanName = "";
  if (ownerName && ownerName !== "undefined" && ownerName !== "null") {
    cleanName = ownerName.trim();
  }

  const isMainAdmin = (
    !cleanName ||
    cleanName === "Gusstore" ||
    cleanName === "Guss81" ||
    cleanName === SUPER_ADMIN_PROVIDER_NAME ||
    cleanName === SUPER_ADMIN_USERNAME
  );

  const finalGreetingName = isMainAdmin ? "Gusstore" : cleanName;
  const webReference = isMainAdmin ? "tu web Gus Store" : "la web Gus Store";

  const message = `Hola ${finalGreetingName}, vengo de ${webReference}. Quiero la cuenta de ${productName} de S/ ${productPrice.toFixed(2)}. ¿A dónde te Yapeo?`;

  return `${BASE_WHATSAPP_DOMAIN}/${safePhone}?text=${encodeURIComponent(message)}`;
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "NetStream Premium",
    price: 29,
    stock: "Disponible",
    category: "Streaming",
    whatsappUrl: "",
    image: netstreamImage,
    ownerId: SUPER_ADMIN_ID,
    ownerUsername: SUPER_ADMIN_USERNAME,
    ownerName: SUPER_ADMIN_PROVIDER_NAME,
    ownerPhone: SUPER_ADMIN_PHONE,
  },
  {
    id: "2",
    name: "CinePlus Ultra",
    price: 35,
    stock: "Disponible",
    category: "Streaming",
    whatsappUrl: "",
    image: cineplusImage,
    ownerId: SUPER_ADMIN_ID,
    ownerUsername: SUPER_ADMIN_USERNAME,
    ownerName: SUPER_ADMIN_PROVIDER_NAME,
    ownerPhone: SUPER_ADMIN_PHONE,
  }
];

export const loadProducts = (): Product[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_PRODUCTS;

  try {
    const parsed = JSON.parse(raw) as Product[];
    if (!parsed.length) return DEFAULT_PRODUCTS;

    const categories = loadCategories();
    const fallbackCategory = categories[0] || "Streaming";

    return parsed.map((product) => {
      const currentOwnerName = product.ownerName || product.ownerUsername || "";
      const currentOwnerPhone = product.ownerPhone || SUPER_ADMIN_PHONE;

      return {
        ...product,
        category: product.category?.trim() || fallbackCategory,
        ownerName: currentOwnerName,
        ownerPhone: currentOwnerPhone,
        whatsappUrl: createWhatsAppUrl(product.name, Number(product.price), currentOwnerPhone, currentOwnerName),
      };
    });
  } catch {
    return DEFAULT_PRODUCTS;
  }
};

const normalizeCategories = (categories: string[]) => {
  const unique = Array.from(new Set(categories.map((category) => category.trim()).filter(Boolean)));
  return unique.length ? unique : DEFAULT_CATEGORIES;
};

export const loadCategories = (): string[] => {
  const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!raw) return DEFAULT_CATEGORIES;
  try { return normalizeCategories(JSON.parse(raw) as string[]); } catch { return DEFAULT_CATEGORIES; }
};

export const saveCategories = (categories: string[]) => {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(normalizeCategories(categories)));
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const loadAnnouncement = (): string => {
  return localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) || DEFAULT_ANNOUNCEMENT;
};

export const saveAnnouncement = (announcement: string) => {
  localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, announcement.trim() || DEFAULT_ANNOUNCEMENT);
};
