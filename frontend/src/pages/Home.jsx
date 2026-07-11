import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>🐾 FosterConnect</h1>
        <p>
          מחברים בין משפחות אומנה פרטיות לבין עמותות ועמותות חילוץ מאושרות —
          כדי שכלבים וחתולים במצוקה ימצאו בית זמני, מהר. המיקוד שלנו הוא{" "}
          <strong>באומנה, לא באימוץ</strong>.
        </p>
        <div className="hero-actions">
          <Link to="/register/foster" className="btn">
            הצטרפות כמשפחה אומנת
          </Link>
          <Link to="/register/organization" className="btn secondary">
            רישום הארגון שלכם
          </Link>
        </div>
      </section>

      <div className="features">
        <div className="card">
          <h3>למשפחות אומנה</h3>
          <p className="muted">
            צרו פרופיל עם המיקום, הזמינות, ואילו חיות אתם יכולים לטפל בהן.
            השהו או עדכנו אותו בכל עת.
          </p>
        </div>
        <div className="card">
          <h3>לעמותות וארגוני חילוץ</h3>
          <p className="muted">
            לאחר אישור הצוות שלנו, חפשו וסננו משפחות אומנה לפי מיקום, זמינות,
            נסיון וצרכי החיה.
          </p>
        </div>
        <div className="card">
          <h3>בטוח ומבוקר</h3>
          <p className="muted">
            כל ארגון נבדק ומאושר על ידי מנהל המערכת לפני שהוא יכול לגשת לפרטי
            משפחות האומנה.
          </p>
        </div>
      </div>
    </div>
  );
}
