import styles from './Hero.module.css';

const Hero = () => {
  const handleButtonClick = () => {};

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.content}>
        <div className={styles.copy}>
          <div className={styles.badge}>☕ Built for Modern Cafes</div>
          <h1 className={styles.title}>Run Your Cafe Digitally with Cafe OS</h1>
          <p className={styles.description}>
            Cafe OS helps cafe owners manage QR menus, smart orders, loyalty rewards,
            and customer engagement from one clean dashboard.
          </p>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} type="button" onClick={handleButtonClick}>
              Login
            </button>
            <button className={styles.btnSecondary} type="button" onClick={handleButtonClick}>
              Signup
            </button>
          </div>
          <div className={styles.meta}>No setup hassle. Launch your digital cafe flow in minutes.</div>
        </div>

        <div className={styles.visualWrap} aria-hidden="true">
          <div className={styles.deviceFrame}>
            <div className={styles.deviceHeader}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
            <div className={styles.deviceBody}>
              <img
                className={styles.cafeImage}
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
                alt=""
                loading="lazy"
              />
              <div className={styles.visualCard}>Today Orders: 128</div>
              <div className={styles.visualCard}>Avg Prep Time: 7m</div>
              <div className={styles.visualCard}>Loyalty Redemptions: 34</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
