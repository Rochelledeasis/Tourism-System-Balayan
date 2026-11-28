import '../style.css';

export default function Home({ onBook, onTrack, onSurvey }) {
  return (
    <>
      {/* NAVIGATION */}
      <header className="home-nav">
        <div className="home-brand">
          <img src="/balayanlogo.png" alt="Visit Balayan" />
          <div>
            <strong>Visit Balayan</strong>
            <small>Tourism Office of Balayan</small>
          </div>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#survey"
            onClick={(e) => {
              e.preventDefault();
              onSurvey();
            }}
          >
            Survey
          </a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button onClick={onTrack}>Track Appointment</button>
          <button className="nav-book" onClick={onBook}>
            Book Appointment
          </button>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <span className="hero-tag">Official Tourism Office</span>
          <h1>Discover Balayan</h1>
          <p>
            Your official gateway to heritage sites, community
            tours, and local experiences in Balayan. Plan your
            visit, receive guidance, and connect with the
            tourism office for a smoother journey.
          </p>

          <div className="hero-buttons">
            <button onClick={onSurvey}>
              Complete the Survey
            </button>
            <button className="light-btn" onClick={onBook}>
              Book an Appointment
            </button>
          </div>

          <div className="hero-tags">
            <span>Heritage sites</span>
            <span>Community tours</span>
            <span>Local experiences</span>
          </div>
        </div>

        <div className="hero-image">
          <img src="/BLYN.jpg" alt="Discover Balayan" />
        </div>
      </section>

      {/* ATTRACTIONS */}
      <section className="attractions" id="attractions">
        <span className="section-label">Featured attractions</span>
        <h2>Explore Balayan</h2>
        <p>
          A curated selection of places to visit, stories to
          discover, and local experiences to plan around.
        </p>

        <div className="attraction-grid">
          <article className="attraction-card">
            <h3>Historic Landmarks</h3>
            <img src="/Immaculate_Concepcion_Parish_Balayan_Batangas4.jpg" alt="Balayan Church" />
            <p>Discover historic architecture, cultural markers,
              and the stories that define Balayan.</p>
          </article>

          <article className="attraction-card">
            <h3>Baywalk</h3>
            <img src="/baywalk.jpg" alt="Balayan Church" />
            <p>Meet local hosts, learn about traditions,
              and experience the town through guided walks.</p>
          </article>

          <article className="attraction-card">
            <h3>Parada ng Letson</h3>
            <img src="/paradangletchon.jpg" alt="Balayan Church" />
            <p>Taste local flavors, visit markets, and connect
              with the everyday rhythm of the town.</p>
          </article>
        </div>
      </section>

      {/* SURVEY */}
      <section className="survey-section" id="survey">
        <div>
          <span className="section-label">Municipality of Balayan</span>
          <h2>Help us serve you better.</h2>
          <h3>Client Satisfaction Measurement (CSM)</h3>
          <p>
            Your feedback helps the Tourism Office improve
            its services and provide a better experience
            for every visitor.
          </p>
          <p>
            Personal information shared will be kept confidential.
          </p>
        </div>

        <div className="survey-qr">
          <h3>Share your experience</h3>

          <p>
            Help us improve our services by completing
            the Client Satisfaction Measurement form.
          </p>

          <button onClick={onSurvey}>
            Open Survey Form
          </button>
</div>
      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div>
          <span className="section-label">Contact us</span>
          <h2>Questions about your visit?</h2>
          <p>
            Reach the Tourism Office of Balayan for visitor
            information, local guidance, and help planning your trip.
          </p>
        </div>

        <div className="contact-grid">
          <div><strong>Visit us</strong><p>Municipal Hall, Poblacion, Balayan, Batangas 4213</p></div>
          <div><strong>Call us</strong><p>(043)-779-8380</p></div>
          <div><strong>Email us</strong><p>info@balayan.gov.ph</p></div>
          <div><strong>Office hours</strong><p>Monday – Friday 8:00AM - 4:00PM</p></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer" id="about">
        <div>
          <strong>Visit Balayan</strong>
          <p>Tourism Office of Balayan</p>
          <p>Your gateway to discovering the beauty and heritage of Balayan.</p>
        </div>
        <div>
          <strong>Navigation</strong>
          <p><a href="#home">Home</a></p>
          <p><a href="#attractions">Attractions</a></p>
          <p><a href="#contact">Contact</a></p>
        </div>
        <div>
          <strong>Services</strong>
          <p>Tourism information</p>
          <p>Visitor assistance</p>
          <p>Appointment services</p>
        </div>
      </footer>
    </>
  );
}
