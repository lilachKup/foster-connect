import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>🐾 FosterConnect</h1>
        <p>
          Connecting private foster families with approved animal shelters and
          rescue organizations — so dogs and cats in need find a temporary home,
          fast. Our focus is <strong>fostering, not adoption</strong>.
        </p>
        <div className="hero-actions">
          <Link to="/register/foster" className="btn">
            Become a foster home
          </Link>
          <Link to="/register/organization" className="btn secondary">
            Register your organization
          </Link>
        </div>
      </section>

      <div className="features">
        <div className="card">
          <h3>For foster families</h3>
          <p className="muted">
            Create a profile with your location, availability, and what animals
            you can care for. Pause or update it anytime.
          </p>
        </div>
        <div className="card">
          <h3>For shelters &amp; rescues</h3>
          <p className="muted">
            Once approved by our team, search and filter foster homes by
            location, availability, experience, and animal needs.
          </p>
        </div>
        <div className="card">
          <h3>Safe &amp; reviewed</h3>
          <p className="muted">
            Every organization is reviewed and approved by an admin before it can
            access foster family details.
          </p>
        </div>
      </div>
    </div>
  );
}
