import styles from './HowItWorks.module.css';

const steps = [
  { number: '01', icon: '✍️', title: 'Café Owner Signs Up', description: 'Register your café on Café OS in under 2 minutes.' },
  { number: '02', icon: '🍽️', title: 'Create Digital Menu', description: 'Add your menu items, categories, prices and images.' },
  { number: '03', icon: '📲', title: 'Customers Scan QR', description: 'Customers scan the QR code at their table to view your menu.' },
  { number: '04', icon: '⚡', title: 'Orders Managed Digitally', description: 'Orders arrive instantly on your dashboard — no paper needed.' },
];

const HowItWorks = () => {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.header}>
        <span className={styles.badge}>How It Works</span>
        <h2 className={styles.title}>Up and running in 4 steps</h2>
        <p className={styles.subtitle}>
          Simple onboarding — your café goes digital in minutes.
        </p>
      </div>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div className={styles.stepCard} key={step.number}>
            <div className={styles.stepNumber}>{step.number}</div>
            <div className={styles.stepIcon}>{step.icon}</div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.description}</p>
            {index < steps.length - 1 && <div className={styles.connector} />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
