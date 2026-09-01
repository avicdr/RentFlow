'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2, MapPin, BedDouble, Shield, CheckCircle, Wifi, Car,
  Tv, ChefHat, Zap, Share2, Copy, Check, Calendar, ArrowLeft,
  IndianRupee, Sparkles, User, Briefcase, FileCheck, Phone, Mail,
  AlertCircle, X, ExternalLink, MessageCircle, Clock,
} from 'lucide-react';
import axios from 'axios';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${property.name} on RentFlow`,
        text: `Rent rooms at ${property.name} starting from ₹${property.minRent?.toLocaleString('en-IN')}/mo`,
        url: shareUrl,
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-foreground">Share Property</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Send this direct listing link to prospective tenants. They can view photos, verified amenities, room availability, and submit verified applications.
        </p>

        <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-xl border border-border">
          <input
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-foreground flex-1 outline-none font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-sm font-semibold shadow-xs transition-colors"
            >
              <Share2 className="h-4 w-4" /> More Options
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationModal({ property, room, onClose }: { property: any; room: any; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [moveInDate, setMoveInDate] = useState('');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [notes, setNotes] = useState('');
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refRelation, setRefRelation] = useState('');
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  const { data: userProfile } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiClient.get('/api/v1/auth/me').then(r => r.data.data).catch(() => null),
  });

  const { mutate: submitApp, isPending, isError, error } = useMutation({
    mutationFn: () => {
      const references = refName ? [{ name: refName, phone: refPhone, relation: refRelation || 'Previous Landlord' }] : [];
      return apiClient.post('/api/v1/applications', {
        propertyId: property._id,
        roomId: room._id,
        preferredMoveInDate: moveInDate,
        employmentInfo: {
          type: employmentType,
          organization,
          designation,
          monthlyIncome: Number(monthlyIncome) || 0,
        },
        references,
        additionalNotes: notes,
      }).then(r => r.data.data);
    },
    onSuccess: (data) => {
      setSubmittedApp(data);
      setStep(3); // Success step
    },
  });

  const minMoveInStr = room.availableFrom
    ? new Date(room.availableFrom).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {step < 3 && (
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Apply for Room {room.roomNumber}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{property.name} · {room.type} (₹{room.monthlyRent || room.rentPerBed}/mo)</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* Step 1: Profile & Move-in date */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3.5 flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="text-xs text-foreground">
                <p className="font-semibold">Verified RentFlow Application</p>
                <p className="text-muted-foreground mt-0.5">Your verified KYC and RentPass score will be shared directly with the landlord.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Preferred Move-in Date *</label>
              <input
                type="date"
                min={minMoveInStr}
                value={moveInDate}
                onChange={e => setMoveInDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {room.availableFrom && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Available from {new Date(room.availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={e => setEmploymentType(e.target.value)}
                  className="w-full h-10 px-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none"
                >
                  <option value="SALARIED">Salaried Employee</option>
                  <option value="SELF_EMPLOYED">Self Employed / Freelancer</option>
                  <option value="STUDENT">Student</option>
                  <option value="BUSINESS_OWNER">Business Owner</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Monthly Income (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 65000"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Organization / Company</label>
                <input
                  placeholder="e.g. TechCorp India"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Designation</label>
                <input
                  placeholder="e.g. Software Engineer"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium hover:bg-muted">Cancel</button>
              <button
                onClick={() => moveInDate && setStep(2)}
                disabled={!moveInDate}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 shadow-xs"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Previous Landlord / Reference (Optional)</label>
              <div className="space-y-2.5">
                <input
                  placeholder="Reference Full Name"
                  value={refName}
                  onChange={e => setRefName(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Contact Phone"
                    value={refPhone}
                    onChange={e => setRefPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    placeholder="Relation (e.g. Past Landlord)"
                    value={refRelation}
                    onChange={e => setRefRelation(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Note for Landlord (Optional)</label>
              <textarea
                rows={3}
                placeholder="Share any special preferences, move-in flexibility, or queries..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            {isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{(error as any)?.response?.data?.message || 'Failed to submit application. Please check details.'}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="h-10 px-4 rounded-xl border border-input text-sm font-medium hover:bg-muted">Back</button>
              <button
                onClick={() => submitApp()}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                {isPending ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Your rental application for Room {room.roomNumber} at {property.name} has been sent directly to the property landlord.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-left space-y-1.5 max-w-xs mx-auto">
              <div className="flex justify-between"><span className="text-muted-foreground">Move-in Date:</span> <span className="font-semibold text-foreground">{moveInDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent:</span> <span className="font-semibold text-foreground">₹{room.monthlyRent || room.rentPerBed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <span className="text-amber-600 dark:text-amber-400 font-semibold">Under Review</span></div>
            </div>

            <div className="pt-2 flex gap-3">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium hover:bg-muted">Close</button>
              <Link
                href="/applications"
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center shadow-xs"
              >
                View My Applications
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicPropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const { data: listingData, isLoading, isError } = useQuery({
    queryKey: ['public-property-listing', slug],
    queryFn: () => axios.get(`${API_URL}/api/v1/listings/slug/${slug}`).then(r => r.data.data),
    retry: 1,
  });

  const property = listingData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading property details...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground opacity-30 mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Property Listing Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This property might currently be unlisted or the URL is incorrect.
        </p>
        <Link href="/marketplace" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Browse Available Properties
        </Link>
      </div>
    );
  }

  const rooms: any[] = property.rooms || [];
  const images: string[] = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80'];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Navbar for Public Page */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/90 backdrop-blur px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-foreground">RentFlow</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-input bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-500" /> Share
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header Hero Section */}
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
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{property.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              {[property.address?.line1, property.address?.city, property.address?.state, property.address?.pincode].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="flex flex-col sm:items-end bg-card border border-border rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted-foreground font-medium">Starting from</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              ₹{property.minRent?.toLocaleString('en-IN')}<span className="text-xs text-muted-foreground font-normal"> / month</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {property.availableBeds} bed{property.availableBeds !== 1 ? 's' : ''} available now
            </p>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden border border-border bg-muted/20">
          <div className="md:col-span-2 h-72 sm:h-96 relative">
            <img src={images[0]} alt={property.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {images.slice(1, 3).map((img, i) => (
              <div key={i} className="h-36 sm:h-46 relative">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {images.length <= 1 && (
              <div className="h-36 sm:h-46 bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                <Building2 className="h-8 w-8 opacity-20" />
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs & Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-foreground">About the Property</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description || `${property.name} is a premium, verified ${property.propertyType.toLowerCase()} accommodation located in ${property.address?.city || 'prime location'}. Fully managed with 24/7 security, high speed WiFi, power backup, and modern living spaces.`}
              </p>
            </div>

            {/* Available Rooms Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Available Rooms</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a room to submit your verified rental application</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
                  {rooms.length} room{rooms.length !== 1 ? 's' : ''} listed
                </span>
              </div>

              {rooms.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                  <BedDouble className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>All rooms are currently occupied. Please check back later.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => {
                    const isAvailable = room.status === 'AVAILABLE' || room.status === 'PARTIALLY_OCCUPIED';
                    const isNotice = room.status === 'NOTICE_PERIOD';

                    return (
                      <div key={room._id} className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-foreground text-base">Room {room.roomNumber}</h3>
                              <p className="text-xs text-muted-foreground">{room.type} · Floor {room.floor || 'G'}</p>
                            </div>
                            <span className={cn(
                              'text-xs px-2.5 py-1 rounded-full font-bold',
                              isAvailable ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                              isNotice ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                              'bg-muted text-muted-foreground'
                            )}>
                              {isAvailable ? `${room.availableBeds} beds available` :
                               isNotice && room.availableFrom ? `Available ${new Date(room.availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` :
                               room.status}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-border flex items-baseline justify-between">
                            <div>
                              <span className="text-xl font-bold text-foreground">₹{(room.monthlyRent || room.rentPerBed)?.toLocaleString('en-IN')}</span>
                              <span className="text-xs text-muted-foreground"> / mo</span>
                            </div>
                            {room.deposit > 0 && (
                              <span className="text-xs text-muted-foreground">₹{room.deposit.toLocaleString('en-IN')} deposit</span>
                            )}
                          </div>

                          {room.furnishing && (
                            <span className="inline-block text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {room.furnishing.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedRoom(room)}
                          disabled={!isAvailable && !isNotice}
                          className="mt-4 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                        >
                          Apply for Room
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground">Amenities & Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(property.amenities || {}).map(([key, val]) => {
                  if (!val) return null;
                  const Icon = AMENITY_ICONS[key] || CheckCircle;
                  return (
                    <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs font-medium text-foreground">
                      <Icon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar / Rules / Verification Card */}
          <div className="space-y-6">
            {/* Direct Application Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-foreground text-sm">Direct Online Application</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                RentFlow verified tenants enjoy fast-tracked lease agreements, security deposit protection, and rent receipts.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium"><Check className="h-4 w-4 text-emerald-500" /> Digital KYC Verification</div>
                <div className="flex items-center gap-2 text-foreground font-medium"><Check className="h-4 w-4 text-emerald-500" /> RentPass™ Score Snapshot</div>
                <div className="flex items-center gap-2 text-foreground font-medium"><Check className="h-4 w-4 text-emerald-500" /> Instant Landlord Notification</div>
              </div>
            </div>

            {/* House Rules */}
            {property.listingDetails?.houseRules && property.listingDetails.houseRules.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-foreground text-sm">House Rules</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {property.listingDetails.houseRules.map((rule: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {shareOpen && <ShareModal property={property} onClose={() => setShareOpen(false)} />}
      {selectedRoom && <ApplicationModal property={property} room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </div>
  );
}
