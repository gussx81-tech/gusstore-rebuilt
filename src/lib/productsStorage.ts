import {
  SUPER_ADMIN_PHONE,
  SUPER_ADMIN_PROVIDER_NAME,
  SUPER_ADMIN_USERNAME,
} from "@/lib/authStorage";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

const ANNOUNCEMENT_STORAGE_KEY = "gusstore_announcement_v1";
const CATEGORIES_STORAGE_KEY = "gusstore_categories_v1";
const BASE_WHATSAPP_DOMAIN = "https://wa.me";
const DEFAULT_ANNOUNCEMENT = "🔥 Ofertas activas hoy: entrega rápida y soporte directo por WhatsApp";
const DEFAULT_CATEGORIES = ["Streaming", "Gaming", "Música"];

export const createWhatsAppUrl = (productName: string, productPrice: number, ownerPhone: string, ownerName?: string) => {
  const safePhone = ownerPhone?.replace(/\D/g, "") || SUPER_ADMIN_PHONE;

  let cleanName = "";
  if (ownerName && ownerName !== "undefined" && ownerName !== "null" && ownerName.trim()) {
    cleanName = ownerName.trim();
  }

  const isMainAdmin = (
    !cleanName ||
    cleanName === "Gusstore" ||
    cleanName === "Guss81" ||
    cleanName === SUPER_ADMIN_PROVIDER_NAME ||
    cleanName === SUPER_ADMIN_USERNAME
  );

  let message: string;
  if (isMainAdmin) {
    message = `Hola Gusstore, vengo de tu web Gus Store. Quiero la cuenta de ${productName} de S/ ${productPrice.toFixed(2)}. ¿A dónde te Yapeo?`;
  } else if (cleanName) {
    message = `Hola ${cleanName}, vengo de la web Gus Store. Quiero la cuenta de ${productName} de S/ ${productPrice.toFixed(2)}. ¿A dónde te Yapeo?`;
  } else {
    message = `Hola, vengo de la web Gus Store. Quiero la cuenta de ${productName} de S/ ${productPrice.toFixed(2)}. ¿A dónde te Yapeo?`;
  }

  return `${BASE_WHATSAPP_DOMAIN}/${safePhone}?text=${encodeURIComponent(message)}`;
};

// --- Supabase products ---

const mapRowToProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  price: Number(row.price),
  stock: row.stock as Product["stock"],
  category: row.category,
  whatsappUrl: createWhatsAppUrl(row.name, Number(row.price), row.owner_phone, row.owner_name),
  image: row.image,
  ownerId: row.owner_id,
  ownerUsername: row.owner_username,
  ownerName: row.owner_name,
  ownerPhone: row.owner_phone,
  ownerLogo: row.owner_logo,
});

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map(mapRowToProduct);
};

export const saveProductToDb = async (product: Product): Promise<boolean> => {
  const { error } = await supabase.from("products").upsert({
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    category: product.category,
    image: product.image,
    owner_id: product.ownerId,
    owner_username: product.ownerUsername,
    owner_name: product.ownerName,
    owner_phone: product.ownerPhone,
    owner_logo: product.ownerLogo || null,
  });

  if (error) {
    console.error("Error saving product:", error);
    return false;
  }
  return true;
};

export const deleteProductFromDb = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Error deleting product:", error);
    return false;
  }
  return true;
};

// --- Categories & Announcement (localStorage, admin-only) ---

const normalizeCategories = (categories: string[]) => {
  const unique = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
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

export const loadAnnouncement = (): string => {
  return localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) || DEFAULT_ANNOUNCEMENT;
};

export const saveAnnouncement = (announcement: string) => {
  localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, announcement.trim() || DEFAULT_ANNOUNCEMENT);
};
