import { useNavigate } from 'react-router-dom';
import styles from './Hero.module.css';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.badge}>☕ Smart Café Management</div>
      <h1 className={styles.title}>Café OS</h1>
      <p className={styles.description}>
        A smart SaaS platform helping cafés manage digital menus,
        orders, rewards and customer relationships.
      </p>
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
          Login
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate('/signup')}>
          Signup
        </button>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.card}>📋 Digital Menu</div>
        <div className={styles.card}>🛒 Smart Orders</div>
        <div className={styles.card}>🎁 Loyalty Rewards</div>
      </div>
    </section>
  );
};

export default Hero;
