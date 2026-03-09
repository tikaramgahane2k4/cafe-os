import styles from './Features.module.css';

const features = [
  {
    icon: '📱',
    title: 'QR Digital Menu',
    description: 'Customers scan a QR code to instantly view the full digital menu — no app needed.',
  },
  {
    icon: '🛒',
    title: 'Smart Ordering System',
    description: 'Customers place orders digitally, reducing wait times and manual errors.',
  },
  {
    icon: '🎁',
    title: 'Gamified Rewards',
    description: 'Customers earn loyalty points on every order and unlock exciting rewards.',
  },
  {
    icon: '⭐',
    title: 'Customer Reviews',
    description: 'Collect ratings and feedback to continuously improve your café experience.',
  },
  {
    icon: '📊',
    title: 'CRM System',
    description: 'Café owners manage customer relationships, preferences, and visit history.',
  },
];

const Features = () => {
  return (
    <section className={styles.features} id="features">
      <div className={styles.header}>
        <span className={styles.badge}>Platform Features</span>
        <h2 className={styles.title}>Everything your café needs</h2>
        <p className={styles.subtitle}>
          One platform to run your entire café — from menus to loyalty programs.
        </p>
      </div>
      <div className={styles.grid}>
        {features.map((f) => (
          <div className={styles.card} key={f.title}>
            <div className={styles.icon}>{f.icon}</div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
