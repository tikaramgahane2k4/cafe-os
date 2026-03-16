import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.inner}>

        <div className={styles.brand}>
          <span className={styles.logo}>☕ Café OS</span>
          <p className={styles.tagline}>
            A smart SaaS platform helping cafés manage digital menus,
            orders, rewards and customer relationships.
          </p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contact</h4>
          <ul className={styles.list}>
            <li>
              <a href="mailto:support@cafeos.com">✉ support@cafeos.com</a>
            </li>
            <li>
              <a href="tel:+91XXXXXXXXXX">📞 +91 XXXXX XXXXX</a>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <ul className={styles.list}>
            <li><a href="#hero">About Cafe OS</a></li>
            <li><a href="#features">Product Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Follow Us</h4>
          <ul className={styles.list}>
            <li><a href="#" target="_blank" rel="noreferrer">📸 Instagram</a></li>
            <li><a href="#" target="_blank" rel="noreferrer">💼 LinkedIn</a></li>
            <li><a href="#" target="_blank" rel="noreferrer">🐦 Twitter</a></li>
          </ul>
        </div>

      </div>
      <div className={styles.bottom}>
        © 2026 Café OS — Smart Café Management Platform
      </div>
    </footer>
  );
};

export default Footer;
