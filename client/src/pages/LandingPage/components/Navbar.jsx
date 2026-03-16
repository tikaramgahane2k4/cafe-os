import { useState } from 'react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', id: 'hero' },
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Benefits', id: 'benefits' },
    { label: 'Contact', id: 'contact' },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo} onClick={() => scrollTo('hero')}>
        ☕ Café OS
      </div>

      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span /><span /><span />
      </button>

      <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
        {navItems.map((item) => (
          <li key={item.id} onClick={() => scrollTo(item.id)}>
            {item.label}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
