export type ProductStock = "Disponible" | "Agotado";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: ProductStock;
  category: string;
  whatsappUrl: string;
  image: string;
  ownerId: string;
  ownerUsername: string;
  ownerName: string;
  ownerPhone: string;
  ownerLogo?: string;
}
