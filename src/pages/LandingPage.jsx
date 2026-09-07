import {
  faArrowRight,
  faBoxesStacked,
  faChartLine,
  faCheck,
  faFileInvoice,
  faLayerGroup,
  faShieldHalved,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const features = [
  {
    icon: faFileInvoice,
    title: "Smart invoicing",
    text: "Create professional invoices, track every status, and keep your billing workflow moving.",
  },
  {
    icon: faBoxesStacked,
    title: "Live stock control",
    text: "Manage products, adjust inventory, and keep a clear history of every stock movement.",
  },
  {
    icon: faUsers,
    title: "Clients in one place",
    text: "Keep customer details organized and reuse them whenever you create a new invoice.",
  },
  {
    icon: faShieldHalved,
    title: "Roles & permissions",
    text: "Give each team member exactly the access they need—nothing more and nothing less.",
  },
  {
    icon: faLayerGroup,
    title: "Multi-business ready",
    text: "Run multiple businesses with isolated data, teams, products, and financial records.",
  },
  {
    icon: faChartLine,
    title: "Clear activity trail",
    text: "Review important actions with audit logs built for accountability and control.",
  },
];

const steps = [
  ["01", "Create your business", "Register your company and become its Business Owner."],
  ["02", "Add products & clients", "Build the records your team needs for daily work."],
  ["03", "Invite your team", "Assign roles for invoicing, inventory, accounts, or viewing."],
  ["04", "Run everything together", "Invoice sales update stock and preserve a reliable history."],
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link to="/" className="landing-brand" aria-label="Invoice App home">
            <span className="landing-brand-mark">
              <FontAwesomeIcon icon={faFileInvoice} />
            </span>
            <span>
              <strong>Invoice App</strong>
              <small>Business, simplified.</small>
            </span>
          </Link>

          <nav className="landing-nav-links" aria-label="Landing page">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#security">Security</a>
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="landing-link-button">Sign in</Link>
            <Link to="/register" className="landing-button landing-button-small">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-orb landing-orb-one" />
          <div className="landing-orb landing-orb-two" />
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-kicker">
                <span />
                Built for growing businesses
              </div>
              <h1>
                Invoices, inventory and teams—
                <em>working as one.</em>
              </h1>
              <p>
                Run your business from one secure workspace. Create invoices,
                manage stock, organize clients, and control what every team
                member can access.
              </p>
              <div className="landing-hero-actions">
                <Link to="/register" className="landing-button">
                  Create your business
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                <a href="#features" className="landing-button landing-button-ghost">
                  Explore features
                </a>
              </div>
              <div className="landing-trust-row">
                <span><FontAwesomeIcon icon={faCheck} /> No credit card</span>
                <span><FontAwesomeIcon icon={faCheck} /> Role-based access</span>
                <span><FontAwesomeIcon icon={faCheck} /> Secure by design</span>
              </div>
            </div>

            <div className="landing-product-preview" aria-label="Product dashboard preview">
              <div className="preview-topbar">
                <div className="preview-brand">
                  <span><FontAwesomeIcon icon={faFileInvoice} /></span>
                  Invoice App
                </div>
                <div className="preview-avatar">ZA</div>
              </div>
              <div className="preview-body">
                <aside className="preview-sidebar">
                  <span className="active"><FontAwesomeIcon icon={faFileInvoice} /></span>
                  <span><FontAwesomeIcon icon={faUsers} /></span>
                  <span><FontAwesomeIcon icon={faBoxesStacked} /></span>
                  <span><FontAwesomeIcon icon={faShieldHalved} /></span>
                </aside>
                <div className="preview-content">
                  <div className="preview-heading">
                    <div>
                      <small>SEPTEMBER OVERVIEW</small>
                      <strong>Good afternoon, Zain</strong>
                    </div>
                    <button type="button">+ New invoice</button>
                  </div>
                  <div className="preview-stats">
                    <article>
                      <span>Revenue</span>
                      <strong>Rs 284,500</strong>
                      <small className="positive">↑ 12.4% this month</small>
                    </article>
                    <article>
                      <span>Pending</span>
                      <strong>Rs 46,200</strong>
                      <small>8 invoices</small>
                    </article>
                    <article>
                      <span>Low stock</span>
                      <strong>12</strong>
                      <small>Needs attention</small>
                    </article>
                  </div>
                  <div className="preview-table">
                    <div className="preview-table-title">
                      <strong>Recent invoices</strong>
                      <span>View all</span>
                    </div>
                    {[
                      ["#INV-2048", "Ahmad Traders", "Rs 32,400", "Paid"],
                      ["#INV-2047", "Nexa Retail", "Rs 18,750", "Pending"],
                      ["#INV-2046", "Hassan & Co.", "Rs 24,100", "Paid"],
                    ].map((row) => (
                      <div className="preview-table-row" key={row[0]}>
                        <strong>{row[0]}</strong>
                        <span>{row[1]}</span>
                        <b>{row[2]}</b>
                        <i className={row[3].toLowerCase()}>{row[3]}</i>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-proof">
          <div className="landing-container landing-proof-grid">
            <div><strong>One workspace</strong><span>for your whole operation</span></div>
            <div><strong>Real-time</strong><span>invoice and stock sync</span></div>
            <div><strong>Permission-first</strong><span>team access control</span></div>
            <div><strong>Multi-tenant</strong><span>business data isolation</span></div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>EVERYTHING YOU NEED</span>
              <h2>One system for the work that keeps your business moving.</h2>
              <p>Simple enough for everyday use, structured enough to support your business as it grows.</p>
            </div>
            <div className="landing-feature-grid">
              {features.map((feature) => (
                <article className="landing-feature-card" key={feature.title}>
                  <div className="landing-feature-icon">
                    <FontAwesomeIcon icon={feature.icon} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                  <span className="landing-feature-arrow">→</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-process" id="how-it-works">
          <div className="landing-container landing-process-grid">
            <div className="landing-process-copy">
              <span className="landing-section-label">A BETTER DAILY WORKFLOW</span>
              <h2>From first product to paid invoice.</h2>
              <p>
                Your records stay connected. The team sells with accurate product
                data, invoice status stays visible, and stock movements remain traceable.
              </p>
              <Link to="/register" className="landing-text-link">
                Set up your workspace <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="landing-steps">
              {steps.map(([number, title, text]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="security">
          <div className="landing-container">
            <div className="landing-security">
              <div className="landing-security-icon">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>
              <div>
                <span className="landing-section-label">CONTROL WITHOUT COMPLEXITY</span>
                <h2>The right access for every person.</h2>
                <p>
                  Business Owners manage their own workspace. Invoice clerks,
                  inventory managers, accountants, and viewers only see the tools
                  their role allows.
                </p>
              </div>
              <ul>
                <li><FontAwesomeIcon icon={faCheck} /> Business-level data isolation</li>
                <li><FontAwesomeIcon icon={faCheck} /> Custom roles and permissions</li>
                <li><FontAwesomeIcon icon={faCheck} /> Secure authenticated sessions</li>
                <li><FontAwesomeIcon icon={faCheck} /> Auditable team activity</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container">
            <div className="landing-cta-card">
              <div>
                <span>YOUR BUSINESS. ONE CLEAR VIEW.</span>
                <h2>Ready to simplify the way you work?</h2>
                <p>Create your business workspace and bring invoices, products, stock, clients, and people together.</p>
              </div>
              <Link to="/register" className="landing-button landing-button-light">
                Get started now <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <Link to="/" className="landing-brand landing-brand-footer">
            <span className="landing-brand-mark"><FontAwesomeIcon icon={faFileInvoice} /></span>
            <span><strong>Invoice App</strong><small>Business, simplified.</small></span>
          </Link>
          <p>Invoices · Inventory · Clients · Teams</p>
          <div>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register business</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
