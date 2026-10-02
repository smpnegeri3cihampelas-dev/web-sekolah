import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import LogoCarousel from '@/components/LogoCarousel';
import BentoNews from '@/components/BentoNews';
import About from '@/components/About';
import Curriculum from '@/components/Curriculum';
import Calendar from '@/components/Calendar';
import Gallery from '@/components/Gallery';
import Extracurricular from '@/components/Extracurricular';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen bg-black">
      <Navbar />
      <Hero />
      <LogoCarousel />
      <BentoNews />
      <About />
      <Calendar />
      <Curriculum />
      <Gallery />
      <Extracurricular />
      <Contact />
      <Footer />
    </main>
  );
}


