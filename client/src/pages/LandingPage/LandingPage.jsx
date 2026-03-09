import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Benefits from './components/Benefits';
import Footer from './components/Footer';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  return (
    <div className={styles.page}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
