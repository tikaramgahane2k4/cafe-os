import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo} onClick={() => scrollTo('hero')}>
        ☕ Café OS
      </div>

      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span /><span />
      </button>

      <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
        <li onClick={() => scrollTo('features')}>Features</li>
        <li onClick={() => scrollTo('how-it-works')}>How it Works</li>
        <li onClick={() => scrollTo('benefits')}>Benefits</li>
        <li>
          <button className={styles.btnOutline} onClick={() => navigate('/login')}>
            Login
          </button>
        </li>
        <li>
          <button className={styles.btnPrimary} onClick={() => navigate('/signup')}>
            Signup
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
