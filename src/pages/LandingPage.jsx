import { useEffect, useState } from "react";
import {
  faArrowRight,
  faBars,
  faBoxesStacked,
  faBuilding,
  faChartLine,
  faCheck,
  faChevronDown,
  faFileInvoice,
  faLayerGroup,
  faShieldHalved,
  faStore,
  faTruckFast,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const NAV_LINKS = [
  ["#features", "Features"],
  ["#who-its-for", "Who it's for"],
  ["#how-it-works", "How it works"],
  ["#security", "Security"],
  ["#faq", "FAQ"],
];

const FEATURES = [
  {
    icon: faFileInvoice,
    title: "Professional invoicing",
    text: "Create clean invoices, track paid and pending amounts, and keep billing moving without extra tools.",
  },
  {
    icon: faBoxesStacked,
    title: "Live stock control",
    text: "Manage products, watch inventory change with every sale, and keep a clear movement history.",
  },
  {
    icon: faUsers,
    title: "Client records",
    text: "Save customer details once and reuse them on every invoice, without searching through old files.",
  },
  {
    icon: faShieldHalved,
    title: "Roles & permissions",
    text: "Give each teammate exactly the access they need — invoicing, stock, accounts, or view-only.",
  },
  {
    icon: faLayerGroup,
    title: "Multiple businesses",
    text: "Register as many companies as you need. Each workspace stays isolated with its own data and team.",
  },
  {
    icon: faChartLine,
    title: "Activity you can trust",
    text: "Audit logs keep important actions visible, so owners always know who changed what and when.",
  },
];

const AUDIENCES = [
  {
    icon: faStore,
    title: "Retail shops",
    text: "Invoice walk-in and regular customers while stock stays accurate after every sale.",
  },
  {
    icon: faTruckFast,
    title: "Wholesale traders",
    text: "Handle bulk orders, keep client accounts organized, and see what is still unpaid.",
  },
  {
    icon: faBuilding,
    title: "Service businesses",
    text: "Bill clients professionally and keep every company record in one controlled workspace.",
  },
  {
    icon: faUsers,
    title: "Growing teams",
    text: "Owners, clerks, and managers work together without sharing one login or mixing data.",
  },
];

const STEPS = [
  ["01", "Register your business", "Create an account, name your company, and become its Business Owner in minutes."],
  ["02", "Add products & clients", "Build the catalog and customer list your team will use every day."],
  ["03", "Invite the right people", "Assign roles for invoicing, inventory, accounts, or viewing — nothing extra."],
  ["04", "Run it as one system", "Sales, stock, and history stay connected as more businesses join the platform."],
];

const FAQS = [
  {
    q: "Can more than one business register on this platform?",
    a: "Yes. This platform is built for multiple businesses. Each company gets its own workspace, team, products, invoices, and records.",
  },
  {
    q: "Will one business see another business’s data?",
    a: "No. Workspaces are isolated. People only see the business they belong to, and owners can switch only between businesses they actually own or were invited into.",
  },
  {
    q: "Who becomes the owner after registration?",
    a: "The person who registers a company becomes its Business Owner. From there they can invite teammates and control roles.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Create a workspace, add your first products and clients, and invite your team when you are ready.",
  },
  {
    q: "Can my team use it on phones as well as desktop?",
    a: "Yes. The workspace is designed for everyday desktop work and stays usable on smaller screens for quick checks and updates.",
  },
];

const STORIES = [
  {
    quote: "We stopped bouncing between spreadsheets, WhatsApp bills, and stock notes. One workspace now runs the shop.",
    name: "Ayesha Khan",
    role: "Owner, city retail",
    image: "/landing/avatar-1.jpg",
  },
  {
    quote: "Each of our companies stays separate, but I can still move between them without mixing records or teams.",
    name: "Omar Siddiqui",
    role: "Director, wholesale group",
    image: "/landing/avatar-2.jpg",
  },
  {
    quote: "Invoice clerks only see billing. Inventory stays with the warehouse team. That control was the whole point.",
    name: "Hira Malik",
    role: "Operations lead",
    image: "/landing/avatar-3.jpg",
  },
];

function LandingImage({ src, alt, className = "", hint }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`landing-photo-slot ${className}`.trim()} role="img" aria-label={alt}>
        <strong>{hint || "Add this image"}</strong>
        <span>{src.replace("/landing/", "")}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function BrandMark() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <>
      {logoFailed ? (
        <span className="landing-brand-mark">
          <FontAwesomeIcon icon={faFileInvoice} />
        </span>
      ) : (
        <img
          src="/landing/logo.png"
          alt=""
          className="landing-logo-img"
          onError={() => setLogoFailed(true)}
        />
      )}
      <span>
        <strong>Invoice App</strong>
        <small>One platform. Many businesses.</small>
      </span>
    </>
  );
}

function ProductPreview() {
  return (
    <div className="landing-product-preview" aria-hidden="true">
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
              <strong>Your businesses, in one view</strong>
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
              <span>Businesses</span>
              <strong>12</strong>
              <small>Active workspaces</small>
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
  );
}

function HeroVisual() {
  const [heroFailed, setHeroFailed] = useState(false);

  return (
    <div className="landing-browser">
      <div className="landing-browser-bar">
        <span /><span /><span />
        <em>app.invoice / dashboard</em>
      </div>
      {heroFailed ? (
        <ProductPreview />
      ) : (
        <img
          src="/landing/hero.png"
          alt="Invoice App dashboard showing invoices, stock and business overview"
          className="landing-hero-shot"
          onError={() => setHeroFailed(true)}
        />
      )}
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.documentElement.style.scrollPaddingTop = "88px";
    return () => {
      document.documentElement.style.scrollBehavior = "";
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link to="/" className="landing-brand" aria-label="Invoice App home" onClick={closeMenu}>
            <BrandMark />
          </Link>

          <nav className="landing-nav-links" aria-label="Primary">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="landing-link-button">Sign in</Link>
            <Link to="/register" className="landing-button landing-button-small">
              Register business
            </Link>
            <button
              type="button"
              className="landing-menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="landing-mobile-menu" role="dialog" aria-label="Mobile navigation">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={closeMenu}>{label}</a>
          ))}
          <Link to="/login" onClick={closeMenu}>Sign in</Link>
          <Link to="/register" className="landing-button" onClick={closeMenu}>
            Register your business
          </Link>
        </div>
      )}

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-kicker">
                <span />
                Multi-business platform
              </div>
              <h1>
                One platform where
                <em> every business can register.</em>
              </h1>
              <p>
                Create a company workspace, invite your team, and run invoices,
                stock, and clients in one secure place. Built for shops,
                traders, and growing teams that need more than a spreadsheet.
              </p>
              <div className="landing-hero-actions">
                <Link to="/register" className="landing-button">
                  Register your business
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                <a href="#features" className="landing-button landing-button-ghost">
                  See how it works
                </a>
              </div>
              <div className="landing-trust-row">
                <span><FontAwesomeIcon icon={faCheck} /> Isolated workspaces</span>
                <span><FontAwesomeIcon icon={faCheck} /> Role-based access</span>
                <span><FontAwesomeIcon icon={faCheck} /> No credit card</span>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section className="landing-proof">
          <div className="landing-container landing-proof-grid">
            <div><strong>Multi-tenant</strong><span>Every business stays separate</span></div>
            <div><strong>Invoices + stock</strong><span>Sales update inventory live</span></div>
            <div><strong>Team-ready</strong><span>Owners control every role</span></div>
            <div><strong>Audit trail</strong><span>Important actions stay visible</span></div>
          </div>
        </section>

        <section className="landing-section" id="who-its-for">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>WHO IT’S FOR</span>
              <h2>Built for the businesses that actually run day to day.</h2>
              <p>Register one company or several. Each workspace is ready for the people who invoice, count stock, and close the books.</p>
            </div>
            <div className="landing-audience-grid">
              {AUDIENCES.map((item) => (
                <article className="landing-audience-card" key={item.title}>
                  <div className="landing-feature-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-tight" id="features">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>EVERYTHING IN ONE PLACE</span>
              <h2>The tools your business already needs, connected.</h2>
              <p>Stop stitching separate apps together. Invoicing, inventory, clients, and permissions live in the same workspace.</p>
            </div>

            <div className="landing-showcase-grid">
              <article className="landing-showcase-card landing-showcase-wide">
                <div className="landing-showcase-copy">
                  <span>INVOICING</span>
                  <h3>Send professional invoices and see what is still unpaid.</h3>
                  <p>Create bills in minutes, track paid and pending status, and keep customer history attached to every document.</p>
                </div>
                <LandingImage
                  src="/landing/invoices.png"
                  alt="Invoice list and invoice detail screens"
                  hint="Invoice dashboard screenshot"
                />
              </article>
              <article className="landing-showcase-card">
                <div className="landing-showcase-copy">
                  <span>INVENTORY</span>
                  <h3>Stock that stays honest.</h3>
                  <p>Products, quantities, and movement history stay in sync as invoices are created.</p>
                </div>
                <LandingImage
                  src="/landing/stock.png"
                  alt="Inventory and stock movement screen"
                  hint="Stock page screenshot"
                />
              </article>
              <article className="landing-showcase-card">
                <div className="landing-showcase-copy">
                  <span>TEAMS</span>
                  <h3>The right access for each person.</h3>
                  <p>Owners invite the team and decide who can bill, count stock, or only view.</p>
                </div>
                <LandingImage
                  src="/landing/team.png"
                  alt="Team roles and permissions screen"
                  hint="Team & roles screenshot"
                />
              </article>
            </div>

            <div className="landing-feature-grid">
              {FEATURES.map((feature) => (
                <article className="landing-feature-card" key={feature.title}>
                  <div className="landing-feature-icon">
                    <FontAwesomeIcon icon={feature.icon} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-process" id="how-it-works">
          <div className="landing-container landing-process-grid">
            <div className="landing-process-copy">
              <span className="landing-section-label">GET STARTED IN MINUTES</span>
              <h2>From first registration to a working business.</h2>
              <p>
                The platform is made for many companies, not one. Register yours,
                set up the records you need, and bring the team in when you are ready.
              </p>
              <Link to="/register" className="landing-text-link">
                Create a workspace <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="landing-steps">
              {STEPS.map(([number, title, text]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="landing-process-photo">
              <LandingImage
                src="/landing/workflow.png"
                alt="Business owner setting up a workspace"
                hint="Workflow / office photo"
              />
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
                <h2>Each business stays private. Each person stays in their role.</h2>
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

        <section className="landing-section landing-stories">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>FROM THE FLOOR</span>
              <h2>Made for the way local businesses actually work.</h2>
              <p>A calmer daily rhythm: invoices go out, stock stays true, and every company keeps its own books.</p>
            </div>
            <div className="landing-stories-grid">
              {STORIES.map((story) => (
                <article className="landing-story-card" key={story.name}>
                  <p>“{story.quote}”</p>
                  <div className="landing-story-person">
                    <LandingImage
                      src={story.image}
                      alt={story.name}
                      className="landing-avatar"
                      hint="Portrait"
                    />
                    <div>
                      <strong>{story.name}</strong>
                      <span>{story.role}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="faq">
          <div className="landing-container landing-faq">
            <div>
              <span className="landing-section-label">QUESTIONS</span>
              <h2>Straight answers before you register.</h2>
              <p>If you are setting up your first company, or bringing several businesses onto one platform, start here.</p>
            </div>
            <div className="landing-faq-list">
              {FAQS.map((item, index) => {
                const open = openFaq === index;
                return (
                  <article className={open ? "open" : ""} key={item.q}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? -1 : index)}
                    >
                      {item.q}
                      <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                    {open && <p>{item.a}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container">
            <div className="landing-cta-card">
              <LandingImage
                src="/landing/cta.jpg"
                alt=""
                className="landing-cta-photo"
                hint="Wide workspace photo"
              />
              <div className="landing-cta-copy">
                <span>YOUR BUSINESS. ONE CLEAR VIEW.</span>
                <h2>Register your company and start working in one place.</h2>
                <p>Create a workspace, add your products and clients, then invite the people who help you run it.</p>
                <Link to="/register" className="landing-button landing-button-light">
                  Get started now <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <Link to="/" className="landing-brand landing-brand-footer">
                <BrandMark />
              </Link>
              <p>
                A multi-business platform for invoicing, inventory, clients, and
                teams. Register your company and keep every record in one secure workspace.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#security">Security</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="#who-its-for">Who it’s for</a>
              <Link to="/register">Register a business</Link>
              <Link to="/login">Owner sign in</Link>
            </div>
            <div>
              <h4>Workspace</h4>
              <span>Invoices</span>
              <span>Inventory</span>
              <span>Clients</span>
              <span>Roles & audit log</span>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>© {new Date().getFullYear()} Invoice App. All rights reserved.</p>
            <div>
              <Link to="/login">Sign in</Link>
              <Link to="/register">Create workspace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
