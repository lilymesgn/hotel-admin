import { Room, Service, GalleryImage } from "./types";

export const ROOMS: Room[] = [
  {
    id: "deluxe-room",
    title: "Deluxe Room",
    description: "Spacious, legacy decor, king bed, city view, traditional & modern amenities.",
    price: 3200,
    imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format",
    imageUrls: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&auto=format",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&auto=format"
    ],
    amenities: ["King Bed", "High-speed Wi-Fi", "Smart TV", "Mini Bar", "Air Conditioning", "Safe Box", "Espresso Machine", "Premium Linens"],
    size: "36 m²",
    maxGuests: 2,
    bedType: "1 Extra-Large Double Bed",
    overview: "Recline in absolute heritage comfort in our premium Deluxe Room. Elegantly furnished with a luxurious King-size bed, handcrafted desks, and windows showcasing the historic streets of Kezira, Dire Dawa. It is ideal for couples, business executives, and leisure travelers alike."
  },
  {
    id: "executive-suite",
    title: "Executive Suite",
    description: "Separate living lounge, vintage luxury bath, panoramic views, premium reception treatment.",
    price: 5500,
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1000&auto=format",
    imageUrls: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1000&auto=format",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&auto=format",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000&auto=format"
    ],
    amenities: ["Master King Bed", "Separate Living Area", "High-speed Wi-Fi", "Two Smart TVs", "Mini Bar & Wine Fridge", "Luxury Bathtub", "Air Conditioning", "Nespresso Machine", "Dedicated Workspace"],
    size: "65 m²",
    maxGuests: 3,
    bedType: "1 Master King Bed + Sofa Bed",
    overview: "The pinnacle of historic comfort at Dire Dawa Ras Hotel. Our Executive Suite offers an expansive, self-contained living and dining lounge separate from the master bedroom. Complemented by vintage styling, warm ambient lights, a premium master bathroom with a deep soaking tub, and custom guest services."
  },
  {
    id: "standard-twin",
    title: "Standard Twin Room",
    description: "Comfortable twin beds, elegant classic wood styling, ideal for friends or colleagues.",
    price: 2800,
    imageUrl: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1000&auto=format",
    imageUrls: [
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1000&auto=format",
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1000&auto=format",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1000&auto=format"
    ],
    amenities: ["Two Twin Beds", "High-speed Wi-Fi", "Work Desk", "LED TV", "Mini Fridge", "Air Conditioning", "Coffee & Tea Station", "In-Room Safe"],
    size: "30 m²",
    maxGuests: 2,
    bedType: "2 Single Beds",
    overview: "A perfect blend of classical timber trim, utility, and comfort. The Standard Twin Room is fitted with two cozy wood-headboard single beds, a collaborative workspace, and high-speed amenities designed to keep you connected. Excellent for friends and family travelers."
  }
];

export const SERVICES: Service[] = [
  {
    id: "comfort-rooms",
    title: "Comfortable Rooms",
    description: "Stylish & spacious rooms for total relaxation with beautiful Dire Dawa Kezira views.",
    iconName: "Bed"
  },
  {
    id: "fine-dining",
    title: "Fine Dining",
    description: "Authentic local Ethiopian specialties & international cuisines, crafted by our premier culinary chefs.",
    iconName: "Utensils"
  },
  {
    id: "free-wifi",
    title: "Free Wi-Fi",
    description: "High-speed, dual-band internet access across all rooms, reception, lounges, and meeting halls.",
    iconName: "Wifi"
  },
  {
    id: "meeting-events",
    title: "Meeting & Events",
    description: "Equipped with pristine audio-visual systems, our halls and gardens are perfect for business or celebrations.",
    iconName: "Calendar"
  },
  {
    id: "concierge-service",
    title: "24/7 Service",
    description: "Round-the-clock reception desk, in-room dining, luggage assistance, and traditional Ethiopian hospitality.",
    iconName: "ConciergeBell"
  }
];

export const GALLERY: GalleryImage[] = [
  {
    id: "g1",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    caption: "Pristine garden path and grand entrance lanes",
    category: "exterior"
  },
  {
    id: "g2",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000",
    caption: "Warm wood legacy deluxe bedchambers",
    category: "rooms"
  },
  {
    id: "g3",
    url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1000",
    caption: "Cozy traditional dining & lounge hospitality",
    category: "dining"
  },
  {
    id: "g4",
    url: "https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?w=1000",
    caption: "Lush tropical scenery around our central courtyard",
    category: "exterior"
  }
];
