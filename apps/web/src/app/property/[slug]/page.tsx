'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, BedDouble, Shield, CheckCircle, Wifi, Car,
  Tv, ChefHat, Zap, Share2, Copy, Check, Calendar, ArrowLeft,
  IndianRupee, Sparkles, X, MessageCircle, Clock,
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TENANT_APP_URL = process.env.NEXT_PUBLIC_TENANT_APP_URL ?? 'http://localhost:3002';

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  security: Shield,
  cctv: Shield,
  powerBackup: Zap,
  laundry: Zap,
  gym: Sparkles,
  ac: Sparkles,
};

function ShareModal({ property, onClose }: { property: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.slug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out ${property.name} on RentFlow!\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Property</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X className="h-5 w-5" /></button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share this verified property listing directly with prospective tenants.
        </p>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-gray-900 dark:text-white flex-1 outline-none font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
        </div>

        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

export default function WebPublicPropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: listingData, isLoading, isError } = useQuery({
    queryKey: ['web-public-property-listing', slug],
    queryFn: () => axios.get(`${API_URL}/api/v1/listings/slug/${slug}`).then(r => r.data.data),
    retry: 1,
  });

  const property = listingData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading property details...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400 opacity-40 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Property Listing Not Found</h1>
        <p className="text-sm text-gray-500 max-w-md">
          This property might currently be unlisted or the URL is incorrect.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Go to Homepage
        </Link>
      </div>
    );
  }

  const rooms: any[] = property.rooms || [];
  const images: string[] = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-gray-900 dark:text-white">RentFlow</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 text-xs font-semibold shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-600" /> Share
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {property.propertyType}
              </span>
              {property.isVerified && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified Property
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{property.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              {[property.address?.line1, property.address?.city, property.address?.state, property.address?.pincode].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="flex flex-col sm:items-end bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-gray-500 font-medium">Starting from</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              ₹{property.minRent?.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-normal"> / month</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {property.availableBeds} bed{property.availableBeds !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="md:col-span-2 h-72 sm:h-96 relative">
            <img src={images[0]} alt={property.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {images.slice(1, 3).map((img, i) => (
              <div key={i} className="h-36 sm:h-46 relative">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Available Rooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Rooms</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} listed
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const isAvailable = room.status === 'AVAILABLE' || room.status === 'PARTIALLY_OCCUPIED';
              const isNotice = room.status === 'NOTICE_PERIOD';

              return (
                <div key={room._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Room {room.roomNumber}</h3>
                        <p className="text-xs text-gray-500">{room.type} · Floor {room.floor || 'G'}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isNotice ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isAvailable ? `${room.availableBeds} beds available` :
                         isNotice && room.availableFrom ? `Available ${new Date(room.availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` :
                         room.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-baseline justify-between">
                      <div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">₹{(room.monthlyRent || room.rentPerBed)?.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-gray-500"> / mo</span>
                      </div>
                      {room.deposit > 0 && (
                        <span className="text-xs text-gray-500">₹{room.deposit.toLocaleString('en-IN')} deposit</span>
                      )}
                    </div>
                  </div>

                  <a
                    href={`${TENANT_APP_URL}/property/${property.slug || property._id}`}
                    className="mt-4 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center transition-colors"
                  >
                    Apply on RentFlow
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {shareOpen && <ShareModal property={property} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
