export interface Room {
  id: string;
  title: string;
  description: string;
  price: number; // in ETB
  imageUrl: string;
  imageUrls?: string[];
  amenities: string[];
  size: string; // e.g. "32 m²"
  maxGuests: number;
  bedType: string;
  overview: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon name
}

export interface Booking {
  id: string;
  roomTitle: string;
  roomPrice: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  totalNights: number;
  totalPrice: number;
  confirmationCode: string;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: "rooms" | "dining" | "exterior" | "lounge";
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
}

export interface HotelInfo {
  name: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  breakfastPrice: number;
  featuredHeading: string;
  featuredSubheading: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}
