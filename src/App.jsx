import './App.css'

const audienceTraits = [
  'Designed for all ages and backgrounds.',
  'Supports people with accessibility needs.',
  'Built for daily use on phones and tablets first.',
  'Keeps ads light so the experience stays enjoyable.',
]

const productPillars = [
  {
    title: 'Inclusive by default',
    detail:
      'Simple UI, readable text, and optional accessibility support so anyone can use HoloStem comfortably.',
  },
  {
    title: 'Short-form media focus',
    detail:
      'Video-first experience inspired by platforms like TikTok, YouTube, and Instagram.',
  },
  {
    title: 'Positive experience',
    detail:
      'Content and community design that promotes happiness, friendship, and curiosity.',
  },
  {
    title: 'Better platform promise',
    detail:
      'Solve the “current platforms do not fully meet user needs” problem with a cleaner and safer product.',
  },
]

const personalityTags = ['Creative', 'Competitive', 'Shy', 'Confident', 'Curious', 'Social', 'Adventurous', 'Logical', 'Funny', 'Any']

const mediaPreferences = ['Videos', 'Games', 'Social Media', 'Music', 'TV Shows', 'Podcasts', 'Anything at all']

function App() {
  return (
    <main className="blueprint-page">
      <section className="hero card">
        <p className="eyebrow">HoloStem • Product Blueprint</p>
        <h1>Audience-driven remake</h1>
        <p>
          This remake uses your profile notes as product requirements (not as a UI copy exercise). It
          turns the character sheet into concrete direction for what HoloStem should be.
        </p>
      </section>

      <section className="card">
        <h2>Target audience summary</h2>
        <ul>
          {audienceTraits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Interests and behavior</h2>
        <div className="chip-row">
          <span className="chip">Sleeping</span>
          <span className="chip">Friends</span>
          <span className="chip">Being Happy</span>
          <span className="chip">Daily tech use</span>
          <span className="chip">Phone + Tablet first</span>
        </div>
      </section>

      <section className="card">
        <h2>Product pillars for HoloStem</h2>
        <div className="pillars">
          {productPillars.map((pillar) => (
            <article key={pillar.title} className="pillar">
              <h3>{pillar.title}</h3>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split">
        <article className="card">
          <h2>Personality fit</h2>
          <div className="chip-row">
            {personalityTags.map((tag) => (
              <span key={tag} className={`chip ${tag === 'Any' ? 'chip-accent' : ''}`}>
                {tag}
              </span>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Media preferences</h2>
          <div className="chip-row">
            {mediaPreferences.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>Why this product should work</h2>
        <p>
          HoloStem is positioned to appeal broadly because it combines inclusive access, familiar
          short-form media patterns, and a lighter-ad experience for users across different ages and
          backgrounds.
        </p>
      </section>
    </main>
  )
}

export default App
