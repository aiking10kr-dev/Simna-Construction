import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Wrench } from 'lucide-react';
import type { AppView } from '../types.ts';

interface BannerSlide {
  id: string;
  image: string;
  kicker: string;
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  ctaLabel: string;
  targetView: AppView;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'piping',
    image: '/src/assets/images/banner_piping_work_1795626380510.jpg',
    kicker: 'Piping Work · पाइपिंग कार्य',
    titleHi: 'पाइप फिटर और वेल्डर की सीधी भर्ती',
    titleEn: 'Direct Hiring for Industrial Piping & Fit-Up',
    subtitleHi: '₹28,000 से ₹30,000 मासिक वेतन · समय पर भुगतान और सुरक्षा सुविधा',
    ctaLabel: 'आवेदन करें / Apply Now',
    targetView: 'apply',
  },
  {
    id: 'structure',
    image: '/src/assets/images/banner_structure_work_1795626381533.jpg',
    kicker: 'Structure Work · स्ट्रक्चर निर्माण',
    titleHi: 'हैवी स्टील स्ट्रक्चर और सुपरवाइजर पद',
    titleEn: 'Heavy Steel Structure & Site Supervision',
    subtitleHi: 'सुपरवाइजर ₹35,000 · अनुभवी और मेहनती टीम के साथ काम करें',
    ctaLabel: 'पद देखें / View Vacancies',
    targetView: 'vacancies',
  },
  {
    id: 'all-work',
    image: '/src/assets/images/banner_all_construction_1795626381580.jpg',
    kicker: 'All Construction Work · संपूर्ण निर्माण कार्य',
    titleHi: 'सुरक्षा पहले — हेलमेट, जूते और यूनिफ़ॉर्म अनिवार्य',
    titleEn: 'Zero-Compromise Site Safety Across All Projects',
    subtitleHi: 'लेबर ₹15,000 · बिना किसी एजेंट शुल्क के सीधा ऑनलाइन आवेदन',
    ctaLabel: 'सुरक्षा नियम / Safety Rules',
    targetView: 'safety',
  },
];

interface BannerSliderProps {
  onNavigate: (view: AppView) => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <section aria-label="Featured Construction Banners" className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
      <div className="relative h-56 sm:h-72 lg:h-80 w-full">
        {!failedImages[currentSlide.id] ? (
          <img
            src={currentSlide.image}
            alt={currentSlide.titleEn}
            referrerPolicy="no-referrer"
            onError={() =>
              setFailedImages((prev) => ({
                ...prev,
                [currentSlide.id]: true,
              }))
            }
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-yellow-950/50 flex items-center justify-center">
            <Wrench className="w-16 h-16 text-yellow-400/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/65 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
          <p className="text-xs font-medium text-yellow-400 tracking-wide">
            {currentSlide.kicker}
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-2xl text-balance">
            {currentSlide.titleHi}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-300 max-w-xl">
            {currentSlide.subtitleHi}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate(currentSlide.targetView)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 hover:bg-yellow-300 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <span>{currentSlide.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous banner"
                className="w-10 h-10 rounded-xl bg-zinc-950/75 border border-zinc-700 text-zinc-200 hover:text-yellow-400 hover:border-yellow-400/50 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next banner"
                className="w-10 h-10 rounded-xl bg-zinc-950/75 border border-zinc-700 text-zinc-200 hover:text-yellow-400 hover:border-yellow-400/50 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 bg-zinc-950/90 py-2.5 border-t border-zinc-800/80">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Slide ${idx + 1}: ${slide.titleEn}`}
            className={`h-2 rounded-full transition-all ${
              idx === activeIndex ? 'w-7 bg-yellow-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
