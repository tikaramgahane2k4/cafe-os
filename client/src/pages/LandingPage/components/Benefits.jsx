import styles from './Benefits.module.css';

const benefits = [
  {
    icon: '⚡',
    title: 'Faster Ordering',
    description: 'Digital ordering reduces wait times and improves service efficiency across your café.',
  },
  {
    icon: '🤝',
    title: 'Better Customer Engagement',
    description: 'Reward systems and reviews help build stronger, lasting relationships with customers.',
  },
  {
    icon: '📋',
    title: 'Digital Menu System',
    description: 'Easily update menus anytime — no printing costs, no delays.',
  },
  {
    icon: '💬',
    title: 'Customer Feedback Collection',
    description: 'Collect ratings and reviews to continuously improve your service quality.',
  },
];

const Benefits = () => {
  return (
    <section className={styles.section} id="benefits">
      <div className={styles.header}>
        <span className={styles.badge}>Why Café OS?</span>
        <h2 className={styles.title}>Benefits for Café Owners</h2>
        <p className={styles.subtitle}>
          Everything you need to run a modern, efficient and customer-loved café.
        </p>
      </div>
      <div className={styles.grid}>
        {benefits.map((b) => (
          <div className={styles.card} key={b.title}>
            <div className={styles.iconWrap}>{b.icon}</div>
            <h3 className={styles.cardTitle}>{b.title}</h3>
            <p className={styles.cardDesc}>{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Benefits;
