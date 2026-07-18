import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const fallbackSponsoredAds = [
  { _id: "demo-nova", brand_name: "Nova Workspace", caption: "Build your best ideas with tools designed for focused, creative work.", image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85", destination: "https://www.notion.so/product" },
  { _id: "demo-pulse", brand_name: "Pulse Fitness", caption: "Personal training plans that move at your pace and fit your goals.", image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85", destination: "https://www.nike.com/fitness" },
  { _id: "demo-horizon", brand_name: "Horizon Travel", caption: "Discover remarkable places and turn your next break into a story.", image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85", destination: "https://www.booking.com/" },
  { _id: "demo-table", brand_name: "The Good Table", caption: "Fresh ingredients, thoughtful recipes, and memorable meals delivered.", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85", destination: "https://www.hellofresh.com/" },
  { _id: "demo-market", brand_name: "MarketFlow", caption: "Grow your business with simple analytics and smarter campaigns.", image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85", destination: "https://www.hubspot.com/products/marketing" },
  { _id: "demo-studio", brand_name: "Form Studio", caption: "Modern essentials created for everyday comfort and confident style.", image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85", destination: "https://www.zara.com/" },
  { _id: "demo-pay", brand_name: "SwiftPay", caption: "Fast, secure payments that keep your business moving forward.", image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85", destination: "https://stripe.com/payments" },
];

const SponsoredCarousel = ({ ads = [] }) => {
  const slides = ads.length > 0 ? ads : fallbackSponsoredAds;
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const pointerStart = useRef(null);
  const dragged = useRef(false);
  const paused = hovered || interacting;

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % slides.length), 2000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  const previous = () => setCurrent((index) => (index - 1 + slides.length) % slides.length);
  const next = () => setCurrent((index) => (index + 1) % slides.length);
  const startArrowInteraction = (event) => {
    event.stopPropagation();
    setInteracting(true);
  };
  const endArrowInteraction = (event) => {
    event.stopPropagation();
    setInteracting(false);
  };
  const pointerDown = (event) => {
    pointerStart.current = event.clientX;
    dragged.current = false;
    setInteracting(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const pointerUp = (event) => {
    if (pointerStart.current !== null) {
      const distance = event.clientX - pointerStart.current;
      if (Math.abs(distance) > 45) {
        dragged.current = true;
        distance > 0 ? previous() : next();
      }
    }
    pointerStart.current = null;
    setInteracting(false);
    window.setTimeout(() => { dragged.current = false; }, 0);
  };

  return (
    <section className="relative w-full max-w-xs rounded-xl bg-white text-xs shadow" aria-label="Sponsored advertisements" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="font-semibold text-slate-800">Sponsored</span>
        <span className="text-[10px] text-slate-400">{current + 1}/{slides.length}</span>
      </div>
      <div className="group relative overflow-hidden touch-pan-y" onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { pointerStart.current = null; setInteracting(false); }}>
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((ad) => (
            <a key={ad._id} href={ad.destination} target="_blank" rel="noopener noreferrer" onClick={(event) => dragged.current && event.preventDefault()} className="w-full shrink-0 px-4 pb-3 text-left" aria-label={`Open sponsored ad from ${ad.brand_name}`}>
              <img src={ad.image_url} alt={ad.brand_name} draggable="false" className="h-44 w-full rounded-lg object-cover" />
              <p className="mt-3 font-semibold text-slate-800">{ad.brand_name}</p>
              <p className="mt-1 line-clamp-2 leading-5 text-slate-600">{ad.caption}</p>
            </a>
          ))}
        </div>
      </div>
      {slides.length > 1 && <>
        <button type="button" onClick={(event) => { event.stopPropagation(); previous(); }} onPointerDown={startArrowInteraction} onPointerUp={endArrowInteraction} onPointerCancel={endArrowInteraction} aria-label="Previous advertisement" className="absolute -left-3 top-[130px] z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow transition duration-200 hover:scale-110 hover:bg-white xl:grid"><ChevronLeft className="h-3 w-3" /></button>
        <button type="button" onClick={(event) => { event.stopPropagation(); next(); }} onPointerDown={startArrowInteraction} onPointerUp={endArrowInteraction} onPointerCancel={endArrowInteraction} aria-label="Next advertisement" className="absolute -right-3 top-[130px] z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow transition duration-200 hover:scale-110 hover:bg-white xl:grid"><ChevronRight className="h-3 w-3" /></button>
      </>}
      {slides.length > 1 && <div className="flex justify-center gap-1.5 pb-4">{slides.map((ad, index) => <button key={ad._id} type="button" onClick={() => setCurrent(index)} aria-label={`Show advertisement ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === current ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-300"}`} />)}</div>}
    </section>
  );
};

export default SponsoredCarousel;
