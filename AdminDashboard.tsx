import React, { useState, useEffect } from "react";
import {
  PieChart,
  Bed,
  CalendarCheck,
  Image as ImageIcon,
  MessageSquare,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Globe,
  Database,
  Sliders,
  DollarSign,
  ChevronRight,
  Info
} from "lucide-react";
import { supabaseService } from "../services/supabaseService";
import { isSupabaseConfigured } from "../lib/supabase";
import { Room, Booking, GalleryImage, Testimonial, HotelInfo } from "../types";

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onBackToSite: () => void;
}

export default function AdminDashboard({ adminEmail, onLogout, onBackToSite }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "bookings" | "gallery" | "testimonials" | "hotel_info" | "setup_guide">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Database list states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modal control states & Form states
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [currentEditingRoom, setCurrentEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Partial<Room>>({
    id: "",
    title: "",
    description: "",
    price: 3000,
    imageUrl: "",
    imageUrls: ["", "", ""],
    amenities: ["Wi-Fi", "Air Conditioning", "TV"],
    size: "35 m²",
    maxGuests: 2,
    bedType: "1 Extra-Large Double Bed",
    overview: ""
  });

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState<{ url: string; caption: string; category: "rooms" | "dining" | "exterior" | "lounge" }>({
    url: "",
    caption: "",
    category: "rooms"
  });

  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [currentEditingTestimonial, setCurrentEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Partial<Testimonial>>({
    name: "",
    role: "",
    quote: "",
    rating: 5,
    avatarUrl: ""
  });

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<Partial<Booking>>({
    roomTitle: "",
    roomPrice: 3000,
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
    totalNights: 1,
    totalPrice: 3000
  });

  // Load database tables on load
  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      const [allRooms, allBookings, allGallery, allTestimonials, info, logs] = await Promise.all([
        supabaseService.getRooms(),
        supabaseService.getBookings(),
        supabaseService.getGallery(),
        supabaseService.getTestimonials(),
        supabaseService.getHotelInfo(),
        supabaseService.getAuditLogs()
      ]);
      setRooms(allRooms);
      setBookings(allBookings);
      setGallery(allGallery);
      setTestimonials(allTestimonials);
      setHotelInfo(info);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error("Failed to load tables:", err);
      showNotice("Failed to fetch fresh database state.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const showNotice = (text: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // -------------------------------------
  // CRUD - ROOM ACTIONS
  // -------------------------------------
  const handleOpenAddRoom = () => {
    setCurrentEditingRoom(null);
    setRoomForm({
      id: "",
      title: "",
      description: "",
      price: 3200,
      imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000",
      imageUrls: [
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000"
      ],
      amenities: ["Wi-Fi", "Air Conditioning", "Smart TV", "Mini Bar", "Premium Linens"],
      size: "36 m²",
      maxGuests: 2,
      bedType: "1 Extra-Large Double Bed",
      overview: "Standard high quality room."
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setCurrentEditingRoom(room);
    setRoomForm({ ...room });
    setRoomModalOpen(true);
  };

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        showNotice("Uploading image to assets bucket...", "info");
        const publicUrl = await supabaseService.uploadImage(file);
        setRoomForm((prev) => ({ ...prev, imageUrl: publicUrl }));
        showNotice("Image uploaded successfully!", "success");
      } catch (err) {
        showNotice("Image transmission failed, using data fallback.", "error");
      }
    }
  };

  const handleRoomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.title || !roomForm.price) {
      showNotice("Please fill in Room Name and Price.", "error");
      return;
    }

    const numericPrice = Number(roomForm.price);
    const roomSlug = roomForm.id || roomForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const completeRoomData: Room = {
      id: roomSlug,
      title: roomForm.title,
      description: roomForm.description || "Indulge in spacious comfort.",
      price: numericPrice,
      imageUrl: roomForm.imageUrl || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000",
      imageUrls: roomForm.imageUrls || [roomForm.imageUrl || ""],
      amenities: roomForm.amenities || ["Wi-Fi"],
      size: roomForm.size || "35 m²",
      maxGuests: Number(roomForm.maxGuests) || 2,
      bedType: roomForm.bedType || "1 Extra-Large Double Bed",
      overview: roomForm.overview || ""
    };

    try {
      if (currentEditingRoom) {
        await supabaseService.updateRoom(completeRoomData);
        showNotice("Room updated successfully!");
      } else {
        await supabaseService.addRoom(completeRoomData);
        showNotice("New room added to portfolio!");
      }
      setRoomModalOpen(false);
      loadDatabase();
    } catch (err: any) {
      showNotice(err.message || "Operation failed", "error");
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this room from database?")) {
      try {
        await supabaseService.deleteRoom(id);
        showNotice("Room deleted.");
        loadDatabase();
      } catch (err) {
        showNotice("Failed to delete room.", "error");
      }
    }
  };

  // -------------------------------------
  // CRUD - BOOKING ACTIONS
  // -------------------------------------
  const handleOpenAddBooking = () => {
    setBookingForm({
      roomTitle: rooms[0]?.title || "Deluxe Room",
      roomPrice: rooms[0]?.price || 3200,
      checkIn: new Date().toISOString().split("T")[0],
      checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      adults: 2,
      children: 0,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      specialRequests: "",
      totalNights: 2,
      totalPrice: (rooms[0]?.price || 3200) * 2
    });
    setBookingModalOpen(true);
  };

  const handleBookingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.guestName || !bookingForm.guestEmail) {
      showNotice("Please fill in main guest contact info.", "error");
      return;
    }

    const tNights = bookingForm.totalNights || 1;
    const tPrice = Number(bookingForm.roomPrice || 3200) * tNights;
    const bookingCode = `RAS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const completeBooking: Booking = {
      id: `booking-${Date.now()}`,
      roomTitle: bookingForm.roomTitle || "Deluxe Room",
      roomPrice: Number(bookingForm.roomPrice || 3200),
      checkIn: bookingForm.checkIn || "",
      checkOut: bookingForm.checkOut || "",
      adults: Number(bookingForm.adults) || 2,
      children: Number(bookingForm.children) || 0,
      guestName: bookingForm.guestName,
      guestEmail: bookingForm.guestEmail,
      guestPhone: bookingForm.guestPhone || "",
      specialRequests: bookingForm.specialRequests || "",
      totalNights: tNights,
      totalPrice: tPrice,
      confirmationCode: bookingCode,
      createdAt: new Date().toISOString()
    };

    try {
      await supabaseService.addBooking(completeBooking);
      showNotice("New reservation inserted into ledger!");
      setBookingModalOpen(false);
      loadDatabase();
    } catch (err) {
      showNotice("Error creating booking", "error");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Cancel and delete this reservation voucher permanently?")) {
      try {
        await supabaseService.deleteBooking(id);
        showNotice("Reservation deleted.");
        loadDatabase();
      } catch (err) {
        showNotice("Failed to delete reservation.", "error");
      }
    }
  };

  // -------------------------------------
  // CRUD - GALLERY ACTIONS
  // -------------------------------------
  const handleOpenAddGallery = () => {
    setGalleryForm({
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
      caption: "",
      category: "rooms"
    });
    setGalleryModalOpen(true);
  };

  const handleGalleryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.url) {
      showNotice("Image link or file is required.", "error");
      return;
    }

    const newPhoto: GalleryImage = {
      id: `gphoto-${Date.now()}`,
      url: galleryForm.url,
      caption: galleryForm.caption || "Special scene",
      category: galleryForm.category
    };

    try {
      await supabaseService.addGalleryImage(newPhoto);
      showNotice("Image registered in gallery!");
      setGalleryModalOpen(false);
      loadDatabase();
    } catch (err) {
      showNotice("Failed to add image.", "error");
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        showNotice("Uploading photo to assets bucket...", "info");
        const publicUrl = await supabaseService.uploadImage(file);
        setGalleryForm((prev) => ({ ...prev, url: publicUrl }));
        showNotice("Photo uploaded successfully!", "success");
      } catch (err) {
        showNotice("Upload failed, using local conversion.", "error");
      }
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (window.confirm("Detach this image from our hotel gallery?")) {
      try {
        await supabaseService.deleteGalleryImage(id);
        showNotice("Gallery photo removed.");
        loadDatabase();
      } catch (err) {
        showNotice("Failed to delete picture.", "error");
      }
    }
  };

  // -------------------------------------
  // CRUD - TESTIMONIALS ACTIONS
  // -------------------------------------
  const handleOpenAddTestimonial = () => {
    setCurrentEditingTestimonial(null);
    setTestimonialForm({
      name: "",
      role: "",
      quote: "",
      rating: 5,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
    });
    setTestimonialModalOpen(true);
  };

  const handleTestimonialFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.quote) {
      showNotice("Name and Review sentence are required.", "error");
      return;
    }

    const completeTestimonial: Testimonial = {
      id: currentEditingTestimonial?.id || `testi-${Date.now()}`,
      name: testimonialForm.name,
      role: testimonialForm.role || "Discerning Traveler",
      quote: testimonialForm.quote,
      rating: Number(testimonialForm.rating) || 5,
      avatarUrl: testimonialForm.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
    };

    try {
      if (currentEditingTestimonial) {
        await supabaseService.updateTestimonial(completeTestimonial);
        showNotice("Testimonial updated!");
      } else {
        await supabaseService.addTestimonial(completeTestimonial);
        showNotice("New guest testimonial registered!");
      }
      setTestimonialModalOpen(false);
      loadDatabase();
    } catch (err) {
      showNotice("Failed to save review.", "error");
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (window.confirm("Annihilate this review from live testimonial slider?")) {
      try {
        await supabaseService.deleteTestimonial(id);
        showNotice("Review testimony removed.");
        loadDatabase();
      } catch (err) {
        showNotice("Deletion error.", "error");
      }
    }
  };

  // -------------------------------------
  // HOTEL INFO SAVE
  // -------------------------------------
  const handleHotelInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelInfo) return;

    try {
      await supabaseService.updateHotelInfo(hotelInfo);
      showNotice("Ras Hotel directory updated successfully!");
      loadDatabase();
    } catch (err) {
      showNotice("Failed to update directory detail.", "error");
    }
  };

  // -------------------------------------
  // METRICS & COMPUTED PROPERTIES
  // -------------------------------------
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const roomsAvailable = rooms.length;
  const pendingReservations = bookings.length;
  const averageNightlyPrice = rooms.length ? Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length) : 0;

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-200 font-sans flex flex-col antialiased text-left select-none">
      {/* Top Telemetry & Controls HUD */}
      <header className="bg-[#131110] border-b border-stone-850/90 py-4 px-6 sticky top-0 z-40 flex items-center justify-between select-none">
        <div className="flex items-center space-x-3 text-left">
          <div className="bg-[#1C1613] p-2 rounded-xl border border-[#D4AF37]/35 inline-flex">
            <span className="font-serif text-lg font-black text-[#D4AF37] leading-none shrink-0 tracking-wider">RAS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white inline-flex items-center space-x-1.5">
              <span>Ras Executive Panel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[10px] text-stone-400 font-mono tracking-tight">Admin: {adminEmail}</p>
          </div>
        </div>

        {/* Global Floating HUD Notification Banner */}
        {notification && (
          <div className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl text-xs border animate-fade-in ${
            notification.type === "success" ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-200" :
            notification.type === "error" ? "bg-rose-950/40 border-rose-500/50 text-rose-200" :
            "bg-[#1C1613] border-[#D4AF37]/45 text-amber-200"
          }`}>
            <span>{notification.text}</span>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {/* Status badge */}
          <div className={`hidden lg:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
            isSupabaseConfigured ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/40" : "bg-amber-950/40 text-[#D4AF37] border border-[#D4AF37]/30"
          }`}>
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>{isSupabaseConfigured ? "Supabase Live Connection" : "Local Sandbox Sync Active"}</span>
          </div>

          <button
            onClick={onBackToSite}
            className="text-stone-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-stone-850 text-xs font-bold uppercase transition inline-flex items-center space-x-1 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden md:inline">Go to Guest Site</span>
          </button>

          <button
            onClick={onLogout}
            className="bg-stone-850 hover:bg-[#852424] text-stone-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase transition inline-flex items-center space-x-2 border border-stone-800 hover:border-red-800 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Core Architecture (Layout columns) */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Navigation Rail Controls */}
        <aside className="w-full md:w-64 bg-[#110F0D] border-b md:border-b-0 md:border-r border-stone-850/80 p-4 shrink-0 flex flex-col justify-between select-none">
          <div className="space-y-6 text-left">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.2em] pl-3">Executive Portals</span>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "overview" ? "bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <PieChart className="w-4 h-4 shrink-0" />
                <span>KPI</span>
              </button>

              <button
                onClick={() => setActiveTab("rooms")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "rooms" ? "bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <Bed className="w-4 h-4 shrink-0" />
                <span>Rooms</span>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "bookings" ? "bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Reservations</span>
              </button>

              <button
                onClick={() => setActiveTab("gallery")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "gallery" ? "bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Gallery</span>
              </button>

              <button
                onClick={() => setActiveTab("testimonials")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "testimonials" ? "bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Reviews</span>
              </button>

              <button
                onClick={() => setActiveTab("hotel_info")}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition cursor-pointer ${
                  activeTab === "hotel_info" ? "bg-[#9C2A2A] text-white border-l-2 border-[#D4AF37] shadow-xl" : "text-stone-400 hover:bg-stone-850 hover:text-white"
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Hotel Info</span>
              </button>
            </nav>
          </div>

          {/* Quick Setup guide trigger bottom */}
          <div className="mt-8 border-t border-stone-850 pt-4 text-left">
            <button
              onClick={() => setActiveTab("setup_guide")}
              className={`w-full px-3.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between transition cursor-pointer ${
                activeTab === "setup_guide" ? "bg-gradient-to-br from-[#1C1613] to-stone-900 border border-[#D4AF37]/50 text-white" : "text-[#D4AF37] bg-stone-900/30 hover:bg-stone-850 border border-[#D4AF37]/20"
              }`}
            >
              <span className="flex items-center space-x-2">
                <Database className="w-4 h-4 animate-bounce" />
                <span>Supabase Setup SQL</span>
              </span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </aside>

        {/* Dynamic Display Panel View */}
        <main className="flex-1 bg-[#0A0908] p-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          {isLoading && (
            <div className="mb-6 bg-stone-900/50 rounded-2xl p-4 flex items-center space-x-2 text-stone-300 pointer-events-none select-none">
              <span className="w-3.5 h-3.5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Connecting Database Ledger...</span>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white">Ras Executive Ledger</h2>
                  <p className="text-xs text-stone-400">Aggregated real-time metrics for Dire Dawa Ras Hotel business operations.</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={loadDatabase}
                    className="bg-neutral-800 hover:bg-neutral-700 text-xs font-bold uppercase px-4 py-2 rounded-xl transition inline-flex items-center space-x-2 cursor-pointer border border-[#D4AF37]/10"
                  >
                    <span>Fetch Reload</span>
                  </button>
                  <button
                    onClick={handleOpenAddBooking}
                    className="bg-[#9C2A2A] hover:bg-[#B33030] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer shadow-lg border border-[#D4AF37]/25"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Booking Voucher</span>
                  </button>
                </div>
              </div>

              {/* Grid Cards KPI metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#131110] p-6 rounded-2xl border border-stone-850/80 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest block mb-2">Total Sales (Ledger)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-serif font-black text-[#D4AF37]">{totalRevenue.toLocaleString()} ETB</span>
                    <DollarSign className="w-4.5 h-4.5 text-[#D4AF37]/50" />
                  </div>
                  <p className="text-[9px] text-[#D4AF37]/80 font-semibold tracking-wider uppercase mt-3">From {bookings.length} reservations</p>
                </div>

                <div className="bg-[#131110] p-6 rounded-2xl border border-stone-850/80 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest block mb-2">Active Rooms Portfolio</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-serif font-black text-white">{roomsAvailable} Rooms</span>
                    <Bed className="w-4.5 h-4.5 text-[#9C2A2A]/50" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-3">{averageNightlyPrice.toLocaleString()} ETB Avg Nightly Cost</p>
                </div>

                <div className="bg-[#131110] p-6 rounded-2xl border border-stone-850/80 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest block mb-2">Reservations Logged</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-serif font-black text-white">{pendingReservations} Slips</span>
                    <CalendarCheck className="w-4.5 h-4.5 text-stone-500" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-3">Ready for concierge pickup</p>
                </div>

                <div className="bg-[#131110] p-6 rounded-2xl border border-stone-850/80 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest block mb-2">Gallery Assets Count</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-serif font-black text-white block">{gallery.length} Images</span>
                    <ImageIcon className="w-4.5 h-4.5 text-stone-500" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-3">Active categories</p>
                </div>
              </div>

              {/* Double Columns Overview Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Status card of database connection */}
                <div className="lg:col-span-4 bg-[#141210] rounded-3xl p-6 border border-stone-800/80 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-bold text-white border-b border-stone-850 pb-2">Ledger Connectivity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 bg-stone-900/60 p-3 rounded-xl border border-stone-850">
                        <div className={`p-2.5 rounded-lg shrink-0 ${isSupabaseConfigured ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40" : "bg-amber-950 text-[#D4AF37] border border-[#D4AF37]/35"}`}>
                          <Database className="w-5 h-5 shrink-0" />
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-white block">Connection Type</span>
                          <span className="text-stone-400 font-mono text-[10px]">
                            {isSupabaseConfigured ? "Production Supabase DB" : "Simulated Local Database"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-900/30 p-4 rounded-xl border border-stone-850 text-xs text-stone-400 leading-normal space-y-2">
                        <span className="font-bold text-white tracking-wide block uppercase text-[10px]">How edits update live site:</span>
                        <p className="text-[11px]">
                          Any modification registered in the Rooms or Hotel info view is synchronized to the database. The client fetches these states dynamically on navigation triggers. If Supabase keys are absent, updates write directly to <strong className="text-white">localStorage</strong> so edits reflect live immediately during testing!
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("setup_guide")}
                    className="mt-6 w-full text-center py-2.5 rounded-xl border border-[#D4AF37]/35 bg-[#1E1714] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#2A1E19] transition cursor-pointer inline-flex items-center justify-center space-x-1.5"
                  >
                    <span>View Supabase SQL Guide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Latest Bookings Feed */}
                <div className="lg:col-span-8 bg-[#131110] border border-stone-850 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-850 pb-3">
                      <h3 className="font-serif text-lg font-bold text-white">Recent Reservation Ledgers</h3>
                      <button onClick={() => setActiveTab("bookings")} className="text-[#D4AF37] hover:text-white text-xs font-bold inline-flex items-center space-x-1 uppercase tracking-wider cursor-pointer">
                        <span>View Ledger Book</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {bookings.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 text-xs">
                        No reservation slips found. Push "New Booking Voucher" to insert one.
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-850/65">
                        {bookings.slice(0, 4).map((bk) => (
                          <div key={bk.id} className="py-3 flex items-center justify-between text-xs text-left">
                            <div>
                               <span className="font-bold text-white block text-sm">{bk.guestName}</span>
                              <span className="text-stone-400 font-mono text-[10px] tracking-tight">{bk.roomTitle} • {bk.totalNights} Nights • {bk.checkIn} to {bk.checkOut}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-serif font-black text-[#D4AF37] block">{(bk.totalPrice || 0).toLocaleString()} ETB</span>
                              <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/30 font-mono">{bk.confirmationCode}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Database Security & Event Logs list */}
              <div className="bg-[#110E0C] border border-stone-850 rounded-3xl p-6 mt-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-850 pb-3 mb-4 gap-2 text-left">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      <span>Security Audit Log Ledger</span>
                    </h3>
                    <p className="text-[11px] text-stone-400">Strict cryptographically stamped records of staff credentials checking and updates</p>
                  </div>
                  <button
                    onClick={async () => {
                      const logs = await supabaseService.getAuditLogs();
                      setAuditLogs(logs || []);
                      showNotice("Audit Log ledger refreshed.", "success");
                    }}
                    className="text-stone-400 hover:text-white text-xs font-bold inline-flex items-center space-x-1.5 uppercase tracking-wider bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 text-xs font-mono">
                    No system security entries registered in current chain.
                  </div>
                ) : (
                  <div className="overflow-x-auto text-left">
                    <table className="w-full text-left text-xs text-stone-300 font-mono min-w-[650px]">
                      <thead>
                        <tr className="border-b border-stone-850 text-[10px] text-stone-500 uppercase tracking-wider">
                          <th className="py-2.5 font-bold">Timestamp</th>
                          <th className="py-2.5 font-bold">Operator</th>
                          <th className="py-2.5 font-bold">IP Address</th>
                          <th className="py-2.5 font-bold">Action</th>
                          <th className="py-2.5 font-bold">Status</th>
                          <th className="py-2.5 font-bold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850/60">
                        {auditLogs.slice(0, 10).map((log) => (
                          <tr key={log.id || log.timestamp} className="hover:bg-stone-900/40">
                            <td className="py-2.5 pr-2 whitespace-nowrap text-stone-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-2.5 pr-2 font-bold text-stone-300">{log.user}</td>
                            <td className="py-2.5 pr-2 text-stone-400">{log.ip}</td>
                            <td className="py-2.5 pr-2">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-stone-800 border border-stone-700/60 font-semibold text-stone-300">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 pr-2">
                              {log.status === "SUCCESS" ? (
                                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/35">
                                  SUCCESS
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/35">
                                  FAILED
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-stone-400 text-[11px] font-sans truncate max-w-[240px]" title={log.details}>
                              {log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ROOMS */}
          {activeTab === "rooms" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white">Rooms Portfolio</h2>
                  <p className="text-xs text-stone-400">Configure suite metadata, prices, sizing, amenities and imagery.</p>
                </div>
                <button
                  onClick={handleOpenAddRoom}
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer border border-[#D4AF37]/30 shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Custom Room</span>
                </button>
              </div>

              {/* Grid layout of rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-[#131110] border border-stone-850 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group">
                    <div className="relative h-48 bg-stone-900 overflow-hidden">
                      <img src={room.imageUrl} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 right-3 bg-black/70 border border-[#D4AF37]/45 px-3 py-1 rounded-full">
                        <span className="font-serif font-black text-[#D4AF37] text-xs leading-none">{room.price.toLocaleString()} ETB <span className="text-[10px] font-sans font-light text-stone-400">/ night</span></span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-serif text-xl font-bold text-white tracking-tight leading-tight">{room.title}</h3>
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{room.description}</p>
                      </div>

                      <div className="border-t border-dashed border-stone-850/65 pt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                        <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">{room.size}</span>
                        <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">{room.bedType}</span>
                        <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">Max {room.maxGuests} Guests</span>
                      </div>

                      <div className="border-t border-stone-850/65 pt-4 flex justify-between gap-2">
                        <button
                          onClick={() => handleOpenEditRoom(room)}
                          className="bg-neutral-850 hover:bg-neutral-750 text-xs px-3 py-2 rounded-xl text-stone-300 font-bold tracking-wide uppercase inline-flex items-center space-x-1.5 border border-stone-800 hover:border-[#D4AF37]/40 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="bg-stone-950/40 hover:bg-rose-950/40 hover:text-rose-400 text-stone-500 hover:border-rose-900/50 text-xs px-3 py-2 rounded-xl border border-stone-850 inline-flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 font-bold" />
                          <span>Annihilate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RESERVATIONS BOOK */}
          {activeTab === "bookings" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white">Reservations Ledger</h2>
                  <p className="text-xs text-stone-400">Track current guest bookings, voucher codes, dates, special requests, and revenue.</p>
                </div>
                <button
                  onClick={handleOpenAddBooking}
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer border border-[#D4AF37]/35 shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Reservation Slot</span>
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-12 text-center text-stone-500 text-sm">
                  We currently hold zero checked-in reservations. Click "Insert Reservation Slot" to trigger one manually.
                </div>
              ) : (
                <div className="bg-[#131110] border border-stone-850 rounded-[32px] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-400">
                      <thead className="bg-[#1D1A18] text-stone-300 font-bold border-b border-stone-850 text-[10px] uppercase tracking-wider font-mono">
                        <tr>
                          <th className="py-4 px-5">Guest Profile</th>
                          <th className="py-4 px-5">Requested Suite</th>
                          <th className="py-4 px-5">Check-In / Out Dates</th>
                          <th className="py-4 px-5">Price (ETB)</th>
                          <th className="py-4 px-5">Confirmation ID</th>
                          <th className="py-4 px-5 text-right">Ledger Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850/65 font-sans">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-stone-900/30 select-all">
                            <td className="py-4 px-5">
                              <span className="font-bold text-white text-sm block leading-none mb-1">{booking.guestName}</span>
                              <span className="text-stone-400 font-mono text-[10px] block">{booking.guestEmail}</span>
                              <span className="text-stone-500 font-mono text-[10px]">{booking.guestPhone}</span>
                            </td>
                            <td className="py-4 px-5 font-bold text-stone-300">
                              <span>{booking.roomTitle}</span>
                              <span className="text-stone-500 text-[10px] block font-light">Price tier: {booking.roomPrice} ETB</span>
                            </td>
                            <td className="py-4 px-5 font-mono text-[11px] space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="text-amber-400 bg-amber-950/20 px-1 py-0.5 rounded">IN</span>
                                <span className="text-stone-300 font-bold">{booking.checkIn}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded">OUT</span>
                                <span className="text-stone-300 font-bold">{booking.checkOut}</span>
                              </div>
                              <span className="text-stone-500 block text-[10px]">{booking.totalNights} Nights stay</span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-serif text-lg font-black text-[#D4AF37]">{(booking.totalPrice || 0).toLocaleString()} ETB</span>
                              {booking.specialRequests ? (
                                <span className="text-[10px] text-stone-400 bg-stone-900 block rounded p-1.5 border border-stone-800 max-w-xs mt-1 shrink-0 italic leading-snug">"{booking.specialRequests}"</span>
                              ) : null}
                            </td>
                            <td className="py-4 px-5 font-mono">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-full border border-emerald-900/35 tracking-wider">{booking.confirmationCode}</span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="p-2 rounded-xl bg-stone-950/40 hover:bg-rose-950/40 text-stone-500 hover:text-rose-400 hover:border-rose-900/40 border border-stone-900 transition flex items-center justify-center cursor-pointer ml-auto"
                                title="Annihilate booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GALLERY MANAGEMENT */}
          {activeTab === "gallery" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white">Media Assets Gallery</h2>
                  <p className="text-xs text-stone-400">Curate pictures for the homepage carousel and slider, sorted by categories.</p>
                </div>
                <button
                  onClick={handleOpenAddGallery}
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer border border-[#D4AF37]/35 shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Gallery Image</span>
                </button>
              </div>

              {/* Photos container grids */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {gallery.map((photo) => (
                  <div key={photo.id} className="bg-[#131110] border border-stone-850 rounded-2xl overflow-hidden shadow-xl group flex flex-col justify-between">
                    <div className="relative h-40 bg-stone-900">
                      <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-102 transition duration-500" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => handleDeleteGallery(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-[#852424] rounded-lg text-stone-400 hover:text-white border border-stone-800 hover:border-red-800 transition cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5 font-bold" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-black/80 border border-stone-850 font-mono text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] px-2 py-0.5 rounded-md">
                        {photo.category}
                      </span>
                    </div>
                    <div className="p-3 text-left">
                      <p className="text-stone-300 text-xs truncate leading-normal font-semibold pl-1 font-sans">{photo.caption || "Special legacy scene"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TESTIMONIALS (GUEST REVIEWS) */}
          {activeTab === "testimonials" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white">Guest Testimonials</h2>
                  <p className="text-xs text-stone-400">Approve, update or purge luxury guest review sliding widgets on your splash page.</p>
                </div>
                <button
                  onClick={handleOpenAddTestimonial}
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer border border-[#D4AF37]/35 shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Testimonial</span>
                </button>
              </div>

              {/* Reviews Card layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-[#131110] border border-stone-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      {/* Rating stars */}
                      <div className="flex text-[#D4AF37] space-x-0.5 text-sm font-semibold pl-1">
                        {"★".repeat(t.rating)}
                        {"☆".repeat(5 - t.rating)}
                      </div>
                      
                      {/* Quote description */}
                      <p className="text-stone-300 text-xs leading-relaxed italic pr-1">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="border-t border-stone-850 pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-left">
                        {t.avatarUrl && (
                          <img src={t.avatarUrl} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-stone-750 shrink-0" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <span className="font-bold text-white block text-xs leading-tight">{t.name}</span>
                          <span className="text-[10px] text-stone-400 tracking-tight leading-none font-mono">{t.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setCurrentEditingTestimonial(t);
                            setTestimonialForm({ ...t });
                            setTestimonialModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-[#D4AF37]/35 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-900/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HOTEL DIRECTORY INFO */}
          {activeTab === "hotel_info" && (
            <div className="space-y-8 animate-fade-in text-left">
              <div>
                <h2 className="font-serif text-3xl font-black text-white">Hotel Directory & Homepage Content</h2>
                <p className="text-xs text-stone-400">Replace hardcoded contact information, address details, pricing structures and promotional text.</p>
              </div>

              {hotelInfo && (
                <form onSubmit={handleHotelInfoSubmit} className="max-w-4xl space-y-6">
                  <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6">
                    <h3 className="font-serif text-lg font-bold text-[#D4AF37] border-b border-stone-850 pb-2">Main Contact Profile</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">Hotel Brand Name</label>
                        <input
                          type="text"
                          required
                          value={hotelInfo.name}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, name: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Physical Address</label>
                        <input
                          type="text"
                          required
                          value={hotelInfo.address}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, address: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Telephone Line</label>
                        <input
                          type="text"
                          required
                          value={hotelInfo.phone}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, phone: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Primary Email</label>
                        <input
                          type="email"
                          required
                          value={hotelInfo.email}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, email: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">WhatsApp Concierge Number</label>
                        <input
                          type="text"
                          required
                          value={hotelInfo.whatsapp}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, whatsapp: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Buffet Breakfast Cost (ETB)</label>
                        <input
                          type="number"
                          required
                          value={hotelInfo.breakfastPrice}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, breakfastPrice: Number(e.target.value) })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6">
                    <h3 className="font-serif text-lg font-bold text-[#D4AF37] border-b border-stone-850 pb-2">Hero Descriptions & Heritage Taglines</h3>
                    
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Main Splash Title</label>
                        <input
                          type="text"
                          required
                          value={hotelInfo.title}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, title: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Home Description Paragraph</label>
                        <textarea
                          rows={4}
                          required
                          value={hotelInfo.description}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, description: e.target.value })}
                          className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37] leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Heritage Segment Header</label>
                          <input
                            type="text"
                            required
                            value={hotelInfo.featuredHeading}
                            onChange={(e) => setHotelInfo({ ...hotelInfo, featuredHeading: e.target.value })}
                            className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Heritage Segment Subtitle</label>
                          <input
                            type="text"
                            required
                            value={hotelInfo.featuredSubheading}
                            onChange={(e) => setHotelInfo({ ...hotelInfo, featuredSubheading: e.target.value })}
                            className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-200 outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#9C2A2A] to-[#801F1F] text-white font-bold px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest cursor-pointer hover:shadow-xl transition-all border border-[#D4AF37]/35 shadow-lg"
                    >
                      Commit Directory Updates
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: SUPABASE SETUP INSTRUCTIONS & SQL CODES */}
          {activeTab === "setup_guide" && (
            <div className="space-y-8 animate-fade-in text-left select-text">
              <div>
                <h2 className="font-serif text-3xl font-bold text-white tracking-tight">Supabase Provisioning Blueprint</h2>
                <p className="text-xs text-stone-400">Step-by-step SQL bootstrap codes, Storage bucket policies, Row-Level Security rules, and Netlify deployment instructions.</p>
              </div>

              {/* Step 1 Setup SQL */}
              <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-stone-850 pb-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-black bg-[#D4AF37] rounded-full font-mono shrink-0">1</span>
                  <h3 className="font-serif text-lg font-bold text-white">Database Bootstrap SQL Code</h3>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-stone-400 leading-normal">
                    Enter the Supabase dashboard of your project, click on <strong className="text-white">SQL Editor</strong>, open a new query, paste the following consolidated SQL commands, and click <strong className="text-emerald-400">Run</strong>:
                  </p>
                  
                  <div className="relative">
                    <pre className="bg-[#050404] border border-stone-850 rounded-2xl p-5 overflow-x-auto text-[11px] text-emerald-300 font-mono leading-relaxed select-all block h-96">
{`-- SQL Setup for Dire Dawa Ras Hotel Database
-- Create 'rooms' catalog
create table public.rooms (
    id text primary key,
    title text not null,
    description text,
    price numeric not null,
    image_url text,
    image_urls jsonb default '[]'::jsonb,
    amenities jsonb default '[]'::jsonb,
    size text,
    max_guests integer default 2,
    bed_type text,
    overview text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'bookings' reservations slips table
create table public.bookings (
    id text primary key,
    room_title text not null,
    room_price numeric not null,
    check_in text not null,
    check_out text not null,
    adults integer default 2,
    children integer default 0,
    guest_name text not null,
    guest_email text not null,
    guest_phone text,
    special_requests text,
    total_nights integer not null,
    total_price numeric not null,
    confirmation_code text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'gallery' photographs table
create table public.gallery (
    id text primary key,
    url text not null,
    caption text,
    category text default 'rooms'::text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'testimonials' guest reviews
create table public.testimonials (
    id text primary key,
    name text not null,
    role text default 'Discerning Traveler'::text,
    avatar_url text,
    quote text not null,
    rating integer default 5,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create single row 'hotel_info' state table
create table public.hotel_info (
    id text primary key default 'main_info'::text,
    name text not null,
    title text not null,
    description text not null,
    phone text not null,
    email text not null,
    address text not null,
    whatsapp text not null,
    breakfast_price numeric default 450,
    featured_heading text,
    featured_subheading text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setup Row-Level Security (RLS) policies for secure auth protection
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.gallery enable row level security;
alter table public.testimonials enable row level security;
alter table public.hotel_info enable row level security;

-- 1. Rooms permissions: Read is anonymous, Mutation requires authentication
create policy "Rooms viewable by everyone" on public.rooms for select using (true);
create policy "Rooms mutable by authenticated admins only" on public.rooms for all using (auth.role() = 'authenticated');

-- 2. Bookings permissions: Write is anonymous (live bookings), Read and Delete require authentication
create policy "Bookings insertable by anyone" on public.bookings for insert with check (true);
create policy "Bookings viewable and managed by admins" on public.bookings for all using (auth.role() = 'authenticated');

-- 3. Gallery permissions: Read is anonymous, Mutation requires authentication
create policy "Gallery photos viewable by everyone" on public.gallery for select using (true);
create policy "Gallery managed by authenticated admins only" on public.gallery for all using (auth.role() = 'authenticated');

-- 4. Testimonials permissions: Read is anonymous, Mutation requires authentication
create policy "Testimonials viewable by everyone" on public.testimonials for select using (true);
create policy "Testimonials managed by authenticated admins only" on public.testimonials for all using (auth.role() = 'authenticated');

-- 5. Hotel info permissions: Read is anonymous, Mutation requires authentication
create policy "Hotel directory details viewable by everyone" on public.hotel_info for select using (true);
create policy "Hotel directory managed by authenticated admins only" on public.hotel_info for all using (auth.role() = 'authenticated');`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 2 Buckets */}
              <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-stone-850 pb-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-black bg-[#D4AF37] rounded-full font-mono shrink-0">2</span>
                  <h3 className="font-serif text-lg font-bold text-white">Storage Buckets (Image Uploads)</h3>
                </div>

                <div className="text-xs text-stone-300 leading-relaxed space-y-4">
                  <p>
                    Within this admin panel, we support direct binary file transfers to store real photographs dynamically. To wire this capability successfully:
                  </p>
                  
                  <ul className="list-decimal list-inside space-y-2 pl-2 text-stone-400 font-sans">
                    <li>Navigate to the <strong className="text-[#D4AF37]">Storage</strong> tab in your left-hand Supabase dashboard navbar.</li>
                    <li>Click on <strong className="text-white">New Bucket</strong>.</li>
                    <li>Set the bucket name to exactly: <strong className="text-white font-mono bg-stone-900 border border-stone-800 px-1 py-0.5 rounded">hotel-assets</strong>.</li>
                    <li>Toggle the bucket option from Private to <strong className="text-emerald-400 font-bold uppercase">Public</strong> (so anyone can fetch the URLs for the rooms page).</li>
                    <li>Save.</li>
                    <li>Within the database console, click <strong className="text-white">Policies</strong> under Storage. Add a security rule letting <strong className="text-[#D4AF37]">authenticated users</strong> upload and mutate paths under the folder <code className="font-mono text-white">room-images/</code>.</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 Netlify */}
              <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-stone-850 pb-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-black bg-[#D4AF37] rounded-full font-mono shrink-0">3</span>
                  <h3 className="font-serif text-lg font-bold text-white">Deploying Your Hotel Site to Netlify</h3>
                </div>

                <div className="text-xs text-stone-300 leading-relaxed space-y-5">
                  <p>
                    Vite outputs full single-page-application (SPA) static directories inside the <code className="font-mono text-white bg-stone-900 px-1.5 py-0.5 rounded">dist/</code> directory. Here is the step-by-step production Netlify workflow:
                  </p>

                  <div className="space-y-4 pl-1 text-left">
                    <div className="space-y-1">
                      <strong className="text-white block font-serif">Step A: Export/Commit Code</strong>
                      <p className="text-stone-400">Commit your code to a secure private GitHub repository. You should ensure .gitignore excludes node_modules and .env.</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-white block font-serif">Step B: Open Netlify Dashboard</strong>
                      <p className="text-stone-400">Log in to netlify.com, choose "Add New Site", and link it securely with your connected GitHub account.</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-white block font-serif">Step C: Setup Build Parameters</strong>
                      <p className="text-stone-400">Configure the directory triggers with these options:</p>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-stone-400">
                        <li>Build Command: <code className="font-mono text-white bg-stone-950 px-1 rounded">npm run build</code></li>
                        <li>Publish Directory: <code className="font-mono text-white bg-stone-950 px-1 rounded">dist</code></li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-white block font-serif">Step D: Add Site Environment Secrets</strong>
                      <p className="text-stone-400">Under Site Settings → Environment Variables, add your keys:</p>
                      <ul className="list-none space-y-1 text-stone-400">
                        <li>🗝️ <strong className="text-[#D4AF37] font-mono">VITE_SUPABASE_URL</strong> = <code className="text-stone-200">https://your-proj.supabase.co</code></li>
                        <li>🗝️ <strong className="text-[#D4AF37] font-mono">VITE_SUPABASE_ANON_KEY</strong> = <code className="text-stone-200">eyJnYWx...</code></li>
                      </ul>
                    </div>

                    <div className="bg-[#1C1613] p-4 rounded-xl border border-[#D4AF37]/30 text-stone-400 flex items-start space-x-2">
                      <Info className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div className="space-y-1 text-[11px]">
                        <span className="font-bold text-white block uppercase font-sans">Vite Environment Variable Rule</span>
                        <span>Only environment variables with the <strong className="text-white font-mono">VITE_</strong> prefix are exposed to your frontend client in production builds. If you omit the prefix, the variables will return as undefined and Supabase queries will fail first.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* ROOM ADMIN EDIT MODAL */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
          <div className="bg-[#12100E] border border-stone-800 rounded-[32px] w-full max-w-2xl p-6 md:p-8 text-left space-y-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-black text-white border-b border-stone-850 pb-3">
              {currentEditingRoom ? "Update Suite Records" : "Register New Portfolio Suite"}
            </h3>

            <form onSubmit={handleRoomFormSubmit} className="space-y-5 text-stone-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-bold text-xs flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Suite Name</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                    placeholder="e.g. Imperial Executive Suite"
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Nightly Rent (ETB)</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: Number(e.target.value) })}
                    placeholder="3500"
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Suite Size (m²)</label>
                  <input
                    type="text"
                    required
                    value={roomForm.size}
                    onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })}
                    placeholder="e.g. 45 m²"
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Max Bed Capacity Guests</label>
                  <input
                    type="number"
                    required
                    value={roomForm.maxGuests}
                    onChange={(e) => setRoomForm({ ...roomForm, maxGuests: Number(e.target.value) })}
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    required
                    value={roomForm.bedType}
                    onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })}
                    placeholder="e.g. 1 Royal Canopy King Bed + Sofa"
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none"
                  />
                </div>

                {/* Slug editor */}
                {!currentEditingRoom && (
                  <div className="space-y-1.5 flex flex-col md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-[#D4AF37] block mb-1">Custom DB ID / Slug (Leave empty to auto-slugify)</label>
                    <input
                      type="text"
                      value={roomForm.id}
                      onChange={(e) => setRoomForm({ ...roomForm, id: e.target.value })}
                      placeholder="e.g. royal-suite"
                      className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 w-full text-xs text-[#D4AF37] font-mono outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1.5 flex flex-col md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Mini Overview Statement</label>
                  <input
                    type="text"
                    required
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="Vintage legacy decor with a luxury private balcony and deep bathtub."
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 w-full text-xs text-stone-100 outline-none underline-none"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Full Detailed Narrative Text</label>
                  <textarea
                    rows={3}
                    required
                    value={roomForm.overview}
                    onChange={(e) => setRoomForm({ ...roomForm, overview: e.target.value })}
                    placeholder="Provide a multi-paragraph description outlining historical accuracy..."
                    className="bg-stone-900 border border-stone-800 rounded-xl p-4 w-full text-xs text-stone-100 outline-none leading-relaxed"
                  />
                </div>

                {/* Primary Image Upload or URL */}
                <div className="space-y-1.5 flex flex-col md:col-span-2 border-t border-dashed border-stone-850/65 pt-3">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Suite Display Image</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        required
                        value={roomForm.imageUrl}
                        onChange={(e) => setRoomForm({ ...roomForm, imageUrl: e.target.value })}
                        placeholder="Paste image URL..."
                        className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 w-full text-xs font-mono outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4 select-none">
                      <label className="bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-[#D4AF37]/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer flex items-center justify-center space-x-1.5 transition">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>Upload File</span>
                        <input type="file" accept="image/*" onChange={handleRoomImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-850 pt-5 flex justify-end space-x-3 select-none">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-stone-850 cursor-pointer text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white border border-[#D4AF37]/35 font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Commit Suite State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY ADD PHOTO MODAL */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#12100E] border border-stone-800 rounded-[32px] w-full max-w-md p-6 text-left space-y-6 relative max-h-[90vh]">
            <h3 className="font-serif text-2xl font-black text-white border-b border-stone-850 pb-2">Add Media Snapshot</h3>

            <form onSubmit={handleGalleryFormSubmit} className="space-y-5 text-xs text-stone-300">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Image Link (URL)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    required
                    value={galleryForm.url}
                    onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })}
                    placeholder="https://..."
                    className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 w-full font-mono outline-none text-stone-100"
                  />
                  <div className="text-center text-[10px] text-stone-500 font-mono">OR</div>
                  <label className="bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-1.5 transition">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>Upload Binary Asset</span>
                    <input type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Photo Caption & Text</label>
                <input
                  type="text"
                  value={galleryForm.caption}
                  onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                  placeholder="e.g. Garden lanes leading to central reception"
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 w-full outline-none text-stone-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Category Group</label>
                <select
                  value={galleryForm.category}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 w-full outline-none text-stone-100"
                >
                  <option value="rooms">Rooms & Suites</option>
                  <option value="dining">Dining & Courtyards</option>
                  <option value="exterior">Exterior & Lawn Lawns</option>
                  <option value="lounge">Lounges & Meeting Rooms</option>
                </select>
              </div>

              <div className="border-t border-stone-850 pt-4 flex justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white border border-[#D4AF37]/30 px-5 py-2 rounded-xl font-bold uppercase tracking-wide cursor-pointer"
                >
                  Register Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUEST TESTIMONIAL ADD/EDIT MODAL */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#12100E] border border-stone-800 rounded-[32px] w-full max-w-sm p-6 text-left space-y-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-black text-white border-b border-stone-850 pb-2">
              {currentEditingTestimonial ? "Edit Review Card" : "Register Guest Testimony"}
            </h3>

            <form onSubmit={handleTestimonialFormSubmit} className="space-y-5 text-stone-300 text-xs text-left">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-400">Guest Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                  placeholder="e.g. Selamawit Tadesse"
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 outline-none font-sans text-stone-100"
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-400">Guest Professional Title</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.role}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                  placeholder="e.g. Cultural Anthropologist"
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 outline-none text-stone-100"
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-400">Review Quotation Column</label>
                <textarea
                  rows={3}
                  required
                  value={testimonialForm.quote}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                  placeholder="The French colonial architectures blending with Ethiopian heritage is remarkable..."
                  className="bg-stone-900 border border-stone-800 rounded-xl p-3 outline-none text-stone-100 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-400">Rating Stars (1-5)</label>
                <select
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 outline-none text-stone-100 font-mono text-left"
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★ (4 Stars)</option>
                  <option value={3}>★★★ (3 Stars)</option>
                  <option value={2}>★★ (2 Stars)</option>
                  <option value={1}>★ (1 Star)</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-400">Avatar Image Link</label>
                <input
                  type="text"
                  value={testimonialForm.avatarUrl}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, avatarUrl: e.target.value })}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 outline-none font-mono text-stone-100"
                />
              </div>

              <div className="border-t border-stone-850 pt-4 flex justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setTestimonialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white border border-[#D4AF37]/30 px-5 py-2 rounded-xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Commit Testimony
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVATION BACKDOOR MANUAL BOOKING MODAL */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#12100E] border border-stone-800 rounded-[32px] w-full max-w-md p-6 text-left space-y-6 relative max-h-[90vh] overflow-y-auto text-stone-300">
            <h3 className="font-serif text-2xl font-black text-white border-b border-stone-850 pb-2">Record Outside Reservation Slips</h3>

            <form onSubmit={handleBookingFormSubmit} className="space-y-4 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={bookingForm.guestName}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                  placeholder="e.g. Dr. Haile Selassie"
                  className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 w-full outline-none text-stone-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Guest Email</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.guestEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                     placeholder="email@provider.com"
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Guest Phone</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    placeholder="+251 91..."
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Select Chosen Suite Room</label>
                <select
                  value={bookingForm.roomTitle}
                  onChange={(e) => {
                    const selRoom = rooms.find((r) => r.title === e.target.value);
                    if (selRoom) {
                      setBookingForm({
                        ...bookingForm,
                        roomTitle: selRoom.title,
                        roomPrice: selRoom.price,
                        totalPrice: selRoom.price * (bookingForm.totalNights || 1)
                      });
                    }
                  }}
                  className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 w-full outline-none text-stone-100 text-xs"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.title}>{r.title} ({r.price.toLocaleString()} ETB)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Adults</label>
                  <input
                    type="number"
                    value={bookingForm.adults}
                    onChange={(e) => setBookingForm({ ...bookingForm, adults: Number(e.target.value) })}
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Children</label>
                  <input
                    type="number"
                    value={bookingForm.children}
                    onChange={(e) => setBookingForm({ ...bookingForm, children: Number(e.target.value) })}
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-stone-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Nights</label>
                  <input
                    type="number"
                    value={bookingForm.totalNights}
                    onChange={(e) => {
                      const nights = Number(e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        totalNights: nights,
                        totalPrice: Number(bookingForm.roomPrice || 3200) * nights
                      });
                    }}
                    className="bg-stone-900 border border-stone-850 rounded-xl px-3 py-2.5 w-full outline-none text-[#D4AF37] text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2 pt-2">
                <div className="flex justify-between items-baseline px-1 text-[11px] font-bold">
                  <span className="text-stone-400">GRAND TOTAL REVENUE TIER</span>
                  <span className="text-base text-[#D4AF37] font-serif font-black">
                    {(Number(bookingForm.roomPrice || 3000) * (bookingForm.totalNights || 1)).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 pl-1">Special Requests Remarks</label>
                <input
                  type="text"
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  placeholder="Need organic fruits basket, airport transfer at 3 PM..."
                  className="bg-stone-900 border border-stone-850 rounded-xl px-4 py-2.5 w-full outline-none text-stone-100 text-xs"
                />
              </div>

              <div className="border-t border-stone-850 pt-4 flex justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="bg-[#9C2A2A] hover:bg-[#B33030] text-white border border-[#D4AF37]/30 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Unseal Voucher Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
