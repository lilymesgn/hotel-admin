import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Room, Booking, GalleryImage, Testimonial, HotelInfo } from "../types";
import { ROOMS, GALLERY } from "../data";

// Initial Testimonial data for fallback & database seeding
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Almaz Kebede",
    role: "Cultural Tour Director",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format",
    quote: "Staying at Dire Dawa Ras Hotel is like stepping back into Ethiopia's rich golden railway history. The hospitality is impeccable, the gardens are lush, and the rooms perfectly capture Kezira's vintage charm.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Michael Chen",
    role: "International Travel Vlogger",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format",
    quote: "A beautiful oasis in Dire Dawa. The French-colonial architecture mixed with Ethiopian heritage makes it incredibly unique. Loved the traditional coffee service and the pool courtyard!",
    rating: 5,
  },
  {
    id: "t3",
    name: "Elias Yosef",
    role: "Senior Business Consultant",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format",
    quote: "The best venue for conferences in Eastern Ethiopia. Exceptional audio-visual systems, wonderful lawns, and spacious, clean twin rooms for guests. Recommended highly.",
    rating: 4,
  }
];

// Initial Hotel Info fallback
const DEFAULT_HOTEL_INFO: HotelInfo = {
  name: "Dire Dawa Ras Hotel",
  title: "A Timeless Landmark of Luxury in Kezira",
  description: "Dating back to the golden era of the Franco-Ethiopian Railway, Dire Dawa Ras Hotel stands as a beacon of historic luxury, classic charm, and pristine hospitality in the heart of Kezira district. Relax in our tropical courtyard gardens or indulge in exceptional local and international cuisine.",
  phone: "+251 251 110 355",
  email: "reservations@diredawarashotel.com",
  address: "Kezira St, Dire Dawa, Ethiopia",
  whatsapp: "+251 915 320 033",
  breakfastPrice: 450,
  featuredHeading: "Our Imperial Heritage",
  featuredSubheading: "A Century of Welcoming Presidents, Diplomats, and Discerning Travelers"
};

// ---------------------------------------------------------------------------
// HELPER FOR LOCAL DB FALLBACKS (Mapps DB schemas to camelCase, keeps states synced)
// ---------------------------------------------------------------------------

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`ras_hotel_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`ras_hotel_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error("Local storage sync error:", error);
  }
};

// ---------------------------------------------------------------------------
// CORE DATABASE SERVICE
// ---------------------------------------------------------------------------

export const supabaseService = {
  // -------------------------------------
  // HOTEL INFO SERVICE
  // -------------------------------------
  async getHotelInfo(): Promise<HotelInfo> {
    if (!isSupabaseConfigured) {
      return getLocalData<HotelInfo>("hotel_info", DEFAULT_HOTEL_INFO);
    }

    try {
      const { data, error } = await supabase
        .from("hotel_info")
        .select("*")
        .eq("id", "main_info")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // If empty in DB, insert default row
        await this.updateHotelInfo(DEFAULT_HOTEL_INFO);
        return DEFAULT_HOTEL_INFO;
      }

      return {
        name: data.name,
        title: data.title,
        description: data.description,
        phone: data.phone,
        email: data.email,
        address: data.address,
        whatsapp: data.whatsapp,
        breakfastPrice: data.breakfast_price,
        featuredHeading: data.featured_heading,
        featuredSubheading: data.featured_subheading
      };
    } catch (err) {
      console.error("Supabase getHotelInfo error, using fallback:", err);
      return getLocalData<HotelInfo>("hotel_info", DEFAULT_HOTEL_INFO);
    }
  },

  async updateHotelInfo(info: HotelInfo): Promise<HotelInfo> {
    // Sync locally first
    saveLocalData("hotel_info", info);

    if (!isSupabaseConfigured) {
      return info;
    }

    try {
      const dbRow = {
        id: "main_info",
        name: info.name,
        title: info.title,
        description: info.description,
        phone: info.phone,
        email: info.email,
        address: info.address,
        whatsapp: info.whatsapp,
        breakfast_price: info.breakfastPrice,
        featured_heading: info.featuredHeading,
        featured_subheading: info.featuredSubheading
      };

      const { error } = await supabase
        .from("hotel_info")
        .upsert(dbRow, { onConflict: "id" });

      if (error) throw error;
      return info;
    } catch (err) {
      console.error("Supabase updateHotelInfo error:", err);
      return info;
    }
  },

  // -------------------------------------
  // ROOMS SERVICE
  // -------------------------------------
  async getRooms(): Promise<Room[]> {
    if (!isSupabaseConfigured) {
      return getLocalData<Room[]>("rooms", ROOMS);
    }

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed database if empty
        console.log("Database 'rooms' table is empty. Seeding defaults...");
        for (const room of ROOMS) {
          await this.addRoom(room);
        }
        return ROOMS;
      }

      return data.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        price: d.price,
        imageUrl: d.image_url,
        imageUrls: Array.isArray(d.image_urls) ? d.image_urls : (typeof d.image_urls === "string" ? JSON.parse(d.image_urls) : d.image_urls || []),
        amenities: Array.isArray(d.amenities) ? d.amenities : (typeof d.amenities === "string" ? JSON.parse(d.amenities) : d.amenities || []),
        size: d.size,
        maxGuests: d.max_guests ?? 2,
        bedType: d.bed_type || "",
        overview: d.overview || ""
      }));
    } catch (err) {
      console.error("Supabase getRooms error, using fallback:", err);
      return getLocalData<Room[]>("rooms", ROOMS);
    }
  },

  async addRoom(room: Room): Promise<Room> {
    const list = getLocalData<Room[]>("rooms", ROOMS);
    const updated = [...list.filter((r) => r.id !== room.id), room];
    saveLocalData("rooms", updated);

    if (!isSupabaseConfigured) {
      return room;
    }

    try {
      const dbRow = {
        id: room.id,
        title: room.title,
        description: room.description,
        price: room.price,
        image_url: room.imageUrl,
        image_urls: room.imageUrls || [room.imageUrl],
        amenities: room.amenities,
        size: room.size,
        max_guests: room.maxGuests,
        bed_type: room.bedType,
        overview: room.overview
      };

      const { error } = await supabase
        .from("rooms")
        .insert(dbRow);

      if (error) throw error;
      return room;
    } catch (err) {
      console.error("Supabase addRoom error:", err);
      return room;
    }
  },

  async updateRoom(room: Room): Promise<Room> {
    const list = getLocalData<Room[]>("rooms", ROOMS);
    const updated = list.map((r) => (r.id === room.id ? room : r));
    saveLocalData("rooms", updated);

    if (!isSupabaseConfigured) {
      return room;
    }

    try {
      const dbRow = {
        id: room.id,
        title: room.title,
        description: room.description,
        price: room.price,
        image_url: room.imageUrl,
        image_urls: room.imageUrls || [room.imageUrl],
        amenities: room.amenities,
        size: room.size,
        max_guests: room.maxGuests,
        bed_type: room.bedType,
        overview: room.overview
      };

      const { error } = await supabase
        .from("rooms")
        .update(dbRow)
        .eq("id", room.id);

      if (error) throw error;
      return room;
    } catch (err) {
      console.error("Supabase updateRoom error:", err);
      return room;
    }
  },

  async deleteRoom(roomId: string): Promise<boolean> {
    const list = getLocalData<Room[]>("rooms", ROOMS);
    const updated = list.filter((r) => r.id !== roomId);
    saveLocalData("rooms", updated);

    if (!isSupabaseConfigured) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase deleteRoom error:", err);
      return false;
    }
  },

  // -------------------------------------
  // BOOKINGS SERVICE
  // -------------------------------------
  async getBookings(): Promise<Booking[]> {
    if (!isSupabaseConfigured) {
      return getLocalData<Booking[]>("bookings", []);
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((d) => ({
        id: d.id,
        roomTitle: d.room_title,
        roomPrice: d.room_price,
        checkIn: d.check_in,
        checkOut: d.check_out,
        adults: d.adults,
        children: d.children,
        guestName: d.guest_name,
        guestEmail: d.guest_email,
        guestPhone: d.guest_phone,
        specialRequests: d.special_requests,
        totalNights: d.total_nights,
        totalPrice: d.total_price,
        confirmationCode: d.confirmation_code,
        createdAt: d.created_at
      }));
    } catch (err) {
      console.error("Supabase getBookings error, using fallback:", err);
      return getLocalData<Booking[]>("bookings", []);
    }
  },

  async addBooking(booking: Booking): Promise<Booking> {
    const list = getLocalData<Booking[]>("bookings", []);
    const updated = [booking, ...list];
    saveLocalData("bookings", updated);

    if (!isSupabaseConfigured) {
      return booking;
    }

    try {
      const dbRow = {
        id: booking.id,
        room_title: booking.roomTitle,
        room_price: booking.roomPrice,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        adults: booking.adults,
        children: booking.children,
        guest_name: booking.guestName,
        guest_email: booking.guestEmail,
        guest_phone: booking.guestPhone,
        special_requests: booking.specialRequests,
        total_nights: booking.totalNights,
        total_price: booking.totalPrice,
        confirmation_code: booking.confirmationCode,
        created_at: booking.createdAt
      };

      const { error } = await supabase
        .from("bookings")
        .insert(dbRow);

      if (error) throw error;
      return booking;
    } catch (err) {
      console.error("Supabase addBooking error:", err);
      return booking;
    }
  },

  async deleteBooking(bookingId: string): Promise<boolean> {
    const list = getLocalData<Booking[]>("bookings", []);
    const updated = list.filter((b) => b.id !== bookingId);
    saveLocalData("bookings", updated);

    if (!isSupabaseConfigured) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase deleteBooking error:", err);
      return false;
    }
  },

  // -------------------------------------
  // GALLERY SERVICE
  // -------------------------------------
  async getGallery(): Promise<GalleryImage[]> {
    if (!isSupabaseConfigured) {
      return getLocalData<GalleryImage[]>("gallery", GALLERY);
    }

    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default gallery if empty
        console.log("Database 'gallery' table is empty. Seeding defaults...");
        for (const image of GALLERY) {
          await this.addGalleryImage(image);
        }
        return GALLERY;
      }

      return data.map((d) => ({
        id: d.id,
        url: d.url,
        caption: d.caption,
        category: d.category
      }));
    } catch (err) {
      console.error("Supabase getGallery error, using fallback:", err);
      return getLocalData<GalleryImage[]>("gallery", GALLERY);
    }
  },

  async addGalleryImage(image: GalleryImage): Promise<GalleryImage> {
    const list = getLocalData<GalleryImage[]>("gallery", GALLERY);
    const updated = [image, ...list.filter((g) => g.id !== image.id)];
    saveLocalData("gallery", updated);

    if (!isSupabaseConfigured) {
      return image;
    }

    try {
      const dbRow = {
        id: image.id,
        url: image.url,
        caption: image.caption,
        category: image.category,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("gallery")
        .insert(dbRow);

      if (error) throw error;
      return image;
    } catch (err) {
      console.error("Supabase addGalleryImage error:", err);
      return image;
    }
  },

  async deleteGalleryImage(id: string): Promise<boolean> {
    const list = getLocalData<GalleryImage[]>("gallery", GALLERY);
    const updated = list.filter((img) => img.id !== id);
    saveLocalData("gallery", updated);

    if (!isSupabaseConfigured) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("gallery")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase deleteGalleryImage error:", err);
      return false;
    }
  },

  // -------------------------------------
  // TESTIMONIALS SERVICE
  // -------------------------------------
  async getTestimonials(): Promise<Testimonial[]> {
    if (!isSupabaseConfigured) {
      return getLocalData<Testimonial[]>("testimonials", DEFAULT_TESTIMONIALS);
    }

    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("Database 'testimonials' table is empty. Seeding defaults...");
        for (const t of DEFAULT_TESTIMONIALS) {
          await this.addTestimonial(t);
        }
        return DEFAULT_TESTIMONIALS;
      }

      return data.map((d) => ({
        id: d.id,
        name: d.name,
        role: d.role,
        avatarUrl: d.avatar_url,
        quote: d.quote,
        rating: d.rating
      }));
    } catch (err) {
      console.error("Supabase getTestimonials error, using fallback:", err);
      return getLocalData<Testimonial[]>("testimonials", DEFAULT_TESTIMONIALS);
    }
  },

  async addTestimonial(t: Testimonial): Promise<Testimonial> {
    const list = getLocalData<Testimonial[]>("testimonials", DEFAULT_TESTIMONIALS);
    const updated = [t, ...list.filter((item) => item.id !== t.id)];
    saveLocalData("testimonials", updated);

    if (!isSupabaseConfigured) {
      return t;
    }

    try {
      const dbRow = {
        id: t.id,
        name: t.name,
        role: t.role,
        avatar_url: t.avatarUrl || "",
        quote: t.quote,
        rating: t.rating,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("testimonials")
        .insert(dbRow);

      if (error) throw error;
      return t;
    } catch (err) {
      console.error("Supabase addTestimonial error:", err);
      return t;
    }
  },

  async updateTestimonial(t: Testimonial): Promise<Testimonial> {
    const list = getLocalData<Testimonial[]>("testimonials", DEFAULT_TESTIMONIALS);
    const updated = list.map((item) => (item.id === t.id ? t : item));
    saveLocalData("testimonials", updated);

    if (!isSupabaseConfigured) {
      return t;
    }

    try {
      const dbRow = {
        id: t.id,
        name: t.name,
        role: t.role,
        avatar_url: t.avatarUrl || "",
        quote: t.quote,
        rating: t.rating
      };

      const { error } = await supabase
        .from("testimonials")
        .update(dbRow)
        .eq("id", t.id);

      if (error) throw error;
      return t;
    } catch (err) {
      console.error("Supabase updateTestimonial error:", err);
      return t;
    }
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    const list = getLocalData<Testimonial[]>("testimonials", DEFAULT_TESTIMONIALS);
    const updated = list.filter((item) => item.id !== id);
    saveLocalData("testimonials", updated);

    if (!isSupabaseConfigured) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase deleteTestimonial error:", err);
      return false;
    }
  },

  // -------------------------------------
  // STORAGE SERVICE (IMAGE UPLOAD)
  // -------------------------------------
  async uploadImage(file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      // Mock upload with local FileReader data url or a nice placeholder
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("File conversion failed"));
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `room-images/${fileName}`;

      // Upload file to 'hotel-assets' bucket
      const { data, error } = await supabase.storage
          .from("hotel-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
          .from("hotel-assets")
          .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error("Supabase image upload error, using local fallback URL:", err);
      // Fallback to local FileReader Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  },

  // -------------------------------------
  // AUDIT LOGS SERVICE (PRODUCTION HARDENED)
  // -------------------------------------
  async addAuditLog(log: { user: string; ip: string; action: string; status: "SUCCESS" | "FAILED"; details: string }): Promise<void> {
    const list = getLocalData<any[]>("audit_logs", []);
    const newEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    saveLocalData("audit_logs", [newEntry, ...list]);

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_email: log.user,
          ip_address: log.ip,
          action: log.action,
          status: log.status,
          details: log.details,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn("Failed to insert audit log row in Supabase:", error);
      }
    } catch (err) {
      console.error("Supabase audit log insert error:", err);
    }
  },

  async getAuditLogs(): Promise<any[]> {
    if (!isSupabaseConfigured) {
      return getLocalData<any[]>("audit_logs", []);
    }

    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map((d) => ({
        id: d.id,
        timestamp: d.created_at || d.timestamp,
        user: d.user_email || "anonymous",
        ip: d.ip_address || "unknown",
        action: d.action,
        status: d.status,
        details: d.details
      }));
    } catch (err) {
      console.error("Supabase getAuditLogs error, using fallback:", err);
      return getLocalData<any[]>("audit_logs", []);
    }
  }
};
