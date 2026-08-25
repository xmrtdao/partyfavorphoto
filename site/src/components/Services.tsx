import studioStationImage from "@/assets/studio-station.jpg";
const weddingBoothImage = "/lovable-uploads/52305c16-be59-45d0-92ad-614aa25fefae.png";
import corporateBoothImage from "@/assets/corporate-booth.jpg";
import celebrationBoothImage from "@/assets/celebration-booth.jpg";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

const Services = () => {
  const { t } = useTranslation();
  
  const services = [
    {
      title: t('services.studioStation.title'),
      subtitle: t('services.studioStation.subtitle'),
      image: studioStationImage,
      price: t('hero.studioStation.price'),
      duration: t('hero.studioStation.duration'),
      features: [
        t('services.studioStation.features.camera'),
        t('services.studioStation.features.backdrops'),
        t('services.features.lighting'),
        t('services.studioStation.features.prints'),
        t('services.studioStation.features.sharing'),
        t('services.studioStation.features.attendant'),
        t('services.features.props'),
        t('services.features.setup')
      ],
      description: t('services.studioStation.description')
    },
    {
      title: t('services.wedding.title'),
      subtitle: t('services.wedding.subtitle'),
      image: weddingBoothImage,
      price: t('hero.wedding.price'),
      duration: t('hero.wedding.duration'),
      features: [
        t('services.wedding.features.custom'),
        t('services.features.brideGroom'),
        t('services.wedding.features.guestbook'),
        t('services.features.onlineGallery'),
        t('services.wedding.features.delivery'),
        t('services.features.coordinator'),
        t('services.wedding.features.setup')
      ],
      description: t('services.wedding.description')
    },
    {
      title: t('services.corporate.title'),
      subtitle: t('services.corporate.subtitle'),
      image: corporateBoothImage,
      price: t('hero.corporate.price'),
      duration: t('hero.corporate.duration'),
      features: [
        t('services.features.brandedBackdrops'),
        t('services.features.corporateProps'),
        t('services.features.digitalDelivery'),
        t('services.corporate.features.social'),
        t('services.features.professionalSetup'),
        t('services.corporate.features.coordination'),
        t('services.features.customLayouts')
      ],
      description: t('services.corporate.description')
    },
    {
      title: t('services.celebration.title'),
      subtitle: t('services.celebration.subtitle'),
      image: celebrationBoothImage,
      price: "From $595",
      duration: "3-5 hours",
      features: [
        t('services.celebration.features.balloons'),
        t('services.celebration.features.themes'),
        t('services.features.ageAppropriate'),
        t('services.features.culturalElements'),
        t('services.features.customDesigns'),
        t('services.celebration.features.coordination'),
        t('services.features.themedDecorations'),
        t('services.features.socialSharing')
      ],
      description: t('services.celebration.description')
    }
  ];

  return (
    <section className="py-3 md:py-6 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground font-playfair">{t('services.title')}</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-inter font-light">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Service Image */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                  {service.price}
                </div>
              </div>
              
              {/* Service Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1 font-inter">
                    {service.subtitle}
                  </p>
                  <h3 className="text-2xl font-bold mb-2 font-playfair">{service.title}</h3>
                  <p className="text-muted-foreground mb-4 font-inter font-light">{service.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-inter">
                    <span>{t('hero.duration')}: {service.duration}</span>
                  </div>
                </div>
                
                {/* Features List */}
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* CTA Button */}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={() => window.open('https://wa.me/12027980610?text=Hi!%20Please%20send%20me%20more%20information%20about%20' + encodeURIComponent(service.title), '_blank')}
                >
                  {t('services.bookNow')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Services Note */}
        <div className="text-center mt-12 md:mt-16 bg-card border rounded-lg p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">{t('services.areas.title')}</h3>
          <p className="text-base md:text-lg text-muted-foreground mb-6">
            {t('services.areas.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Washington D.C.</span>
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Maryland</span>
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Virginia</span>
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Colorado</span>
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Texas</span>
            <span className="px-3 md:px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs md:text-sm">Florida</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;