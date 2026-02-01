import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import About from './sections/About';
import Partners from './sections/Partners';
import Prizes from './sections/Prizes';
import Timeline from './sections/Timeline';
import Judges from './sections/Judges';
import FAQ from './sections/FAQ';
import Footer from './sections/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Initialize smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Refresh ScrollTrigger on load
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main>
        <Hero />
        <div id="about">
          <About />
        </div>
        <Partners />
        <div id="prizes">
          <Prizes />
        </div>
        <div id="timeline">
          <Timeline />
        </div>
        <div id="judges">
          <Judges />
        </div>
        <div id="faq">
          <FAQ />
        </div>
        <div id="footer">
          <Footer />
        </div>
      </main>
    </div>
  );
}

export default App;
