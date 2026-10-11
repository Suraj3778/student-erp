import './AboutDeveloper.css'

const developer = {
  name: 'Suraj Yadav',
  location: 'Prayagraj, Uttar Pradesh, India',
  email: 'officialsuraj7607@gmail.com',
}

const socialProfiles = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/suraj_yadav__manda?dlrf=MW5uNWF3azB0bXphaw==',
  },
  {
    name: 'LinkedIn',
    url: 'https://in.linkedin.com/in/suraj-yadav-67b2a0299',
  },
]

const technologies = ['React', 'Vite', 'Supabase']

export default function AboutDeveloper() {
  return (
    <div className="developer-page">
      <header className="developer-page-header">
        <a className="developer-brand" href="#/" aria-label="Student ERP home">
          <span className="developer-brand-mark" aria-hidden="true">SE</span>
          <span>Student ERP</span>
        </a>
        <a className="developer-back-link" href="#/">
          Back to portal
        </a>
      </header>

      <main className="developer-main">
        <section className="developer-hero" aria-labelledby="developer-title">
          <div className="developer-hero-copy">
            <p className="developer-eyebrow">ABOUT THE DEVELOPER</p>
            <h1 id="developer-title">Built with purpose by {developer.name}</h1>
            <p className="developer-intro">
              I’m {developer.name}, a developer from {developer.location}. I enjoy
              building practical digital tools that make everyday work clearer,
              more connected, and easier to manage.
            </p>
            <a className="developer-contact-button" href={`mailto:${developer.email}`}>
              Get in touch <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="developer-hero-art" aria-hidden="true">
            <div className="developer-art-orbit developer-art-orbit-one" />
            <div className="developer-art-orbit developer-art-orbit-two" />
            <div className="developer-art-card">
              <span className="developer-art-label">DESIGN · BUILD · IMPROVE</span>
              <span className="developer-art-initials">SY</span>
              <span className="developer-art-caption">Thoughtful software<br />for real-world learning.</span>
            </div>
            <span className="developer-art-dot developer-art-dot-one" />
            <span className="developer-art-dot developer-art-dot-two" />
          </div>
        </section>

        <section className="developer-details" aria-label="Developer and project information">
          <article className="developer-info-card developer-contact-card">
            <p className="developer-eyebrow">CONNECT</p>
            <h2>Let’s stay in touch</h2>
            <a className="developer-email" href={`mailto:${developer.email}`}>
              {developer.email}
            </a>
            <p className="developer-location">
              <span aria-hidden="true">⌖</span> {developer.location}
            </p>
            <nav className="developer-social-links" aria-label="Social profiles">
              {socialProfiles.map((profile) => (
                <a
                  key={profile.name}
                  href={profile.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${developer.name} on ${profile.name} (opens in a new tab)`}
                >
                  {profile.name}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </nav>
          </article>

          <article className="developer-info-card developer-project-card">
            <p className="developer-eyebrow">THE PROJECT</p>
            <h2>A connected campus experience</h2>
            <p>
              Student ERP brings essential academic workflows together in one
              place. Students can follow their courses and progress, while
              teachers and administrators manage the information and tasks
              relevant to their roles.
            </p>
            <div className="developer-tech-list" aria-label="Technology stack">
              {technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
          </article>
        </section>
      </main>

      <footer className="developer-page-footer">
        <span>Developed by {developer.name}</span>
        <a href="#/">Return to Student ERP</a>
      </footer>
    </div>
  )
}
