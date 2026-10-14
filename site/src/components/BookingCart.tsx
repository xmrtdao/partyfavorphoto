import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/contexts/CartContext";
import { 
  CalendarIcon, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2, 
  Clock,
  CheckCircle,
  Star,
  Zap,
  ChevronDown,
  ChevronUp,
  CalendarCheck
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import EventDatePicker from "@/components/EventDatePicker";

/**
 * The self-serve booking funnel.
 *
 * One constant, so the site can never drift into sending half its traffic to
 * the old manual path and half to the new one. Everything below — the calendar,
 * the availability fetch, the hand-off — resolves through this.
 */
const BOOKING_FUNNEL_URL = 'https://book.partyfavorphoto.com';

/**
 * Is the self-serve funnel actually up?
 *
 * WHY THIS IS PROBED RATHER THAN ASSUMED
 * --------------------------------------
 * The funnel's public hostname depends on a Cloudflare tunnel whose ingress is
 * configured in a dashboard, not in the repo. So the code can be deployed, the
 * CTA can be live, and the destination can still be a hard 404 — which is
 * exactly the state right now.
 *
 * Shipping a primary "Check availability & book" button that leads to a 404
 * would be a REGRESSION: it would replace a booking path that works (the manual
 * one below) with one that does not, and nobody would notice until a client
 * told them. So the button is offered only when the funnel answers.
 *
 * When the tunnel hostname is added, this flips on its own with no redeploy.
 *
 * The booking API sends Access-Control-Allow-Origin: *, so this probe works from
 * the site's own origin. It is null until it settles, and the manual path is the
 * primary in the meantime rather than a spinner.
 */
function useFunnelLive(): boolean | null {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);
    fetch(`${BOOKING_FUNNEL_URL}/api/pfp-book/config`, { signal: ac.signal })
      .then((r) => setLive(r.ok))
      .catch(() => setLive(false))
      .finally(() => clearTimeout(timer));
    return () => { ac.abort(); clearTimeout(timer); };
  }, []);
  return live;
}

interface CartItem {
  id: string;
  type: 'standard' | 'premium';
  name: string;
  basePrice: number;
  hours: number;
  quantity: number;
  totalPrice: number;
}

const BookingCart = () => {
  const { t } = useTranslation();
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [date, setDate] = useState<Date>();
  const funnelLive = useFunnelLive();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [selectedHours, setSelectedHours] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Base pricing structure - aligned with partyfavorphoto.com
  const BASE_PRICE_2HRS = 498; // Base price for minimum 2 hours
  const HOURLY_RATE = 249; // Each additional hour

  // Calculate price based on hours
  const calculatePrice = (hours: number) => {
    if (hours <= 2) return BASE_PRICE_2HRS;
    return BASE_PRICE_2HRS + (hours - 2) * HOURLY_RATE;
  };

  // Get current price for selected hours
  const currentPrice = calculatePrice(selectedHours);

  const handleAddToCart = () => {
    if (selectedHours < 2) {
      toast({
        title: t('cart.invalidSelection'),
        description: t('cart.minimumBooking'),
        variant: "destructive",
      });
      return;
    }

    const existingItem = cartItems.find(item => item.hours === selectedHours);
    
    const newItem = {
      id: `studiobooth-${selectedHours}h-${Date.now()}`,
      type: 'standard' as const,
      name: `StudioStation Photo Booth - ${selectedHours} Hours`,
      basePrice: currentPrice,
      hours: selectedHours,
      quantity: 1,
      totalPrice: currentPrice
    };

    addToCart(newItem);

    if (existingItem) {
      toast({
        title: t('cart.updatedCart'),
        description: `${t('cart.increasedQuantity')} ${selectedHours}h ${t('cart.service')}`,
      });
    } else {
      toast({
        title: t('cart.addedToCart'),
        description: `${selectedHours}h StudioStation ${t('cart.serviceAdded')}`,
      });
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    removeFromCart(itemId);
    toast({
      title: t('cart.removedFromCart'),
      description: `${item?.name} ${t('cart.removed')}`,
    });
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item && item.quantity + change === 0) {
      toast({
        title: t('cart.removedFromCart'),
        description: `${item.name} ${t('cart.removed')}`,
      });
    }
    updateQuantity(itemId, change);
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: t('cart.cartCleared'),
      description: t('cart.allItemsRemoved'),
    });
  };

  /**
   * Hand the visitor to the self-serve funnel at book.partyfavorphoto.com.
   *
   * Everything already chosen here travels along in the query string, so the
   * funnel opens with the date and package filled in rather than making someone
   * re-enter what they just typed.
   *
   * No total is passed across, on purpose. The funnel re-prices from its own
   * catalogue, which is the same one the contract and the Stripe charge are
   * built from. A price displayed on one page and charged on another is how a
   * customer ends up arguing with an invoice.
   */
  const openBookingFunnel = () => {
    if (!date || cartItems.length === 0) return;

    const premium = cartItems.some((i: any) => /premium|4x6|4×6/i.test(i.name || ''));
    const hoursMatch = cartItems
      .map((i: any) => String(i.name || '').match(/(\d)\s*(?:hr|hour)/i))
      .find(Boolean);
    const hours = hoursMatch ? hoursMatch[1] : null;

    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (hours) params.set('hours', String(hours));
    params.set('rate', premium ? 'premium' : 'standard');

    window.location.href = BOOKING_FUNNEL_URL + '/?' + params.toString();
  };

  const sendWhatsAppOrder = async () => {
    if (!date || cartItems.length === 0 || !customerName || !customerEmail) {
      toast({
        title: t('cart.incompleteOrder'),
        description: !customerName ? 'Please enter your name' : !customerEmail ? 'Please enter your email' : !date ? t('cart.selectDateFirst') : t('cart.addItemsFirst'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const orderDetails = [
        `📅 Event Date: ${format(date, 'EEEE, MMMM do, yyyy')}`,
        `👤 Name: ${customerName}`,
        `📧 Email: ${customerEmail}`,
        customerPhone ? `📞 Phone: ${customerPhone}` : '',
        '',
        '📸 StudioStation Photo Booth Services:',
        ...cartItems.map(item => 
          `• ${item.name} × ${item.quantity} - $${item.totalPrice.toFixed(2)}`
        ),
        '',
        `💰 Subtotal: $${getTotalPrice().toFixed(2)}`,
        `📦 Total Items: ${getTotalItems()}`,
        '',
        '🆕 New booking request from website!'
      ].filter(Boolean).join('\n');
      
      // Send to fleet chat instead of WhatsApp
      const res = await fetch('https://relay.mobilemonero.com/api/fleet-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'vex', message: '🛒 BOOKING REQUEST\n\n' + orderDetails, channel: 'all' })
      });
      
      if (res.ok) {
        toast({
          title: 'Booking Sent!',
          description: 'Your booking request has been sent to our team. We will confirm availability shortly!',
        });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send booking. Please call (202) 798-0610.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 bg-background">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 font-playfair">{t('booking.title')}</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-inter px-2 mb-4">
            {t('booking.subtitle')}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const gallerySection = document.getElementById('gallery');
              if (gallerySection) {
                gallerySection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="mb-2"
            >
              {t('cart.viewWork')}
            </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {/* Configuration Panel */}
          <Card className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Date Selection */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold font-playfair flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('cart.selectDate')}
              </h3>
              {/* A real calendar with live availability, not <input type="date">.
                  The native widget cannot be styled to match the brand, renders
                  differently on every phone, and — the part that matters — cannot
                  show that a date has all four StudioStations already committed.
                  That knowledge has to surface here, before anyone fills in a
                  form, not three steps later.

                  The availability fetch degrades: if the booking service is
                  unreachable the calendar still picks dates and says so. */}
              <EventDatePicker
                value={date ? format(date, 'yyyy-MM-dd') : null}
                onChange={(iso) => {
                  if (!iso) { setDate(undefined); return; }
                  // Noon, not midnight: a date parsed at 00:00 renders as the
                  // PREVIOUS day in any timezone west of UTC, which is how an
                  // event date silently becomes the night before.
                  const d = new Date(iso + 'T12:00:00');
                  setDate(d);
                  toast({
                    title: t('cart.dateSelected'),
                    description: format(d, "EEEE, MMMM do, yyyy"),
                  });
                }}
                availabilityUrl={BOOKING_FUNNEL_URL + '/api/pfp-book'}
              />
            </div>

            <Separator />

            {/* Hour Selection */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold font-playfair flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('cart.serviceDuration')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t('cart.hours')}: {selectedHours}</span>
                  <span className="text-primary font-bold">${currentPrice}</span>
                </div>
                
                <Slider
                  value={[selectedHours]}
                  onValueChange={(value) => setSelectedHours(value[0])}
                  max={8}
                  min={2}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 hrs</span>
                  <span>4 hrs</span>
                  <span>6 hrs</span>
                  <span>8 hrs</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('cart.includes.camera')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('cart.includes.backdrops')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('cart.includes.printing')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('cart.includes.setup')}</span>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-10 sm:h-11 font-semibold smooth-transition hover:scale-[1.02] text-sm sm:text-base"
                disabled={selectedHours < 2}
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t('cart.addService')} {selectedHours}h {t('cart.service')} - ${currentPrice}
              </Button>
            </div>
          </Card>

          {/* Shopping Cart */}
          <Card id="cart" className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold font-playfair flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('cart.title')}
              </h3>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive text-xs"
                  >
                    {t('cart.clearAll')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="flex items-center gap-1"
                >
                  <Badge variant="secondary" className="animate-bounce-gentle">
                    {getTotalItems()}
                  </Badge>
                  {isCartOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className={cn(
              "overflow-hidden smooth-transition",
              isCartOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground animate-fade-in">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-inter mb-1">{t('cart.empty')}</p>
                  <p className="text-xs font-inter">{t('cart.emptySubtext')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-muted/30 rounded-lg p-3 animate-fade-in smooth-transition hover:bg-muted/50"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h6 className="font-medium text-sm truncate">{item.name}</h6>
                          <p className="text-xs text-muted-foreground">
                            ${item.basePrice} × {item.quantity} = ${item.totalPrice}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive shrink-0 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.hours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  {/* Contact Info — required for booking */}
                  <div className="space-y-3 border border-primary/20 rounded-lg p-3 bg-primary/5">
                    <h4 className="text-sm font-semibold text-primary">{t('cart.yourInfo')}</h4>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="email"
                      placeholder="Your Email *"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Your Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t('cart.total')}:</span>
                      <span className="text-xl font-bold text-primary">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{t('cart.professionalExperience')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{t('cart.instantBooking')}</span>
                      </div>
                    </div>
                    
                    {/* PRIMARY PATH: the self-serve funnel — offered only once we
                        know it answers. See useFunnelLive() for why that matters
                        and why this is not simply always-on. */}
                    {funnelLive === true && (
                      <Button
                        onClick={openBookingFunnel}
                        className="w-full bg-primary hover:bg-primary-elegant text-primary-foreground font-semibold py-2 sm:py-3 h-10 sm:h-11 smooth-transition hover:scale-[1.02] text-sm sm:text-base"
                        disabled={!date || cartItems.length === 0}
                      >
                        <CalendarCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Check availability &amp; book
                      </Button>
                    )}

                    <Button
                      onClick={sendWhatsAppOrder}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 h-10 sm:h-11 smooth-transition hover:scale-[1.02] text-sm sm:text-base"
                      disabled={!date || cartItems.length === 0 || isLoading}
                    >
                      {isLoading ? (
                        t('cart.openingWhatsApp')
                      ) : (
                        <>
                          <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t('cart.bookWhatsApp')}
                        </>
                      )}
                    </Button>
                    
                    {(!date || cartItems.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center">
                        {!date ? t('cart.selectDateToContinue') : t('cart.addServicesToContinue')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BookingCart;