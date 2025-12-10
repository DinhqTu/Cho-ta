export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
}

export const restaurant: Restaurant = {
  id: "rest-001",
  name: "Bát Cơm Mặn",
  logo: "/assets/images/logo_batcomman.jpg",
};

export const menuItems: MenuItem[] = [
  {
    id: "m-001",
    name: "Sushi Set A",
    description: "10 pieces of seasonal sushi.",
    price: 12.5,
    image: "/assets/menu/sushi-set-a.jpg",
    category: "Sushi",
  },
  {
    id: "m-002",
    name: "Ramen Tonkotsu",
    description: "Pork broth, chashu, egg, noodles.",
    price: 9,
    image: "/assets/menu/ramen.png",
    category: "Noodles",
  },
  {
    id: "m-003",
    name: "Gyoza",
    description: "Pan-fried pork dumplings (6 pcs).",
    price: 6.5,
    image: "/assets/menu/gyoza.jpg",
    category: "Appetizers",
  },
  {
    id: "m-004",
    name: "Yakitori Set",
    description: "Grilled chicken skewers with tare sauce.",
    price: 8,
    image: "/assets/menu/yakitori.jpg",
    category: "Grilled",
  },
  {
    id: "m-005",
    name: "Tempura Udon",
    description: "Hot udon with crispy shrimp tempura.",
    price: 11,
    image: "/assets/menu/tempura-udon.jpg",
    category: "Noodles",
  },
  {
    id: "m-006",
    name: "Matcha Mochi",
    description: "Soft rice cakes with green tea filling.",
    price: 5,
    image: "/assets/menu/matcha-mochi.jpg",
    category: "Desserts",
  },
];
