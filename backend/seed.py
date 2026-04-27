"""Run once to seed the database with sample companies."""
from app.database import engine, Base, SessionLocal
from app.models import Company

Base.metadata.create_all(bind=engine)

COMPANIES = [
    {"name": "Stripe", "industry": "Fintech", "avg_rating": 4.7, "review_count": 312, "rating_work": 4.8, "rating_mentorship": 4.6, "rating_compensation": 4.9, "rating_culture": 4.5, "return_offer_rate": 72, "top_tags": ["Go", "Ruby", "TypeScript"], "ai_overview": "Stripe internships are defined by real ownership and fast feedback loops. Interns are embedded in product teams from day one and ship production code within the first few weeks. The culture is intensely written-first — meetings are rare, async is the default. Compensation is top-of-market and the technical bar is genuinely high."},
    {"name": "Google", "industry": "Technology", "avg_rating": 4.5, "review_count": 1204, "rating_work": 4.5, "rating_mentorship": 4.6, "rating_compensation": 4.8, "rating_culture": 4.2, "return_offer_rate": 65, "top_tags": ["Python", "C++", "Go"], "ai_overview": "Google internships offer world-class infrastructure and engineers, but the experience varies significantly by team. Interns with strong hosts who advocate for them thrive; others can feel lost in the scale. Strong comp and legendary perks. Pick your team carefully."},
    {"name": "Meta", "industry": "Technology", "avg_rating": 4.2, "review_count": 847, "rating_work": 4.3, "rating_mentorship": 4.0, "rating_compensation": 4.9, "rating_culture": 3.8, "return_offer_rate": 68, "top_tags": ["React", "Python", "Hack"], "ai_overview": "Meta internships are fast-paced and performance-driven. Interns get meaningful projects with production impact. The culture has shifted post-2022 — leaner, more focused on efficiency. Comp is exceptional. Would-return rate is high among those who thrive in high-accountability environments."},
    {"name": "Amazon", "industry": "Technology", "avg_rating": 3.8, "review_count": 2103, "rating_work": 3.9, "rating_mentorship": 3.6, "rating_compensation": 4.0, "rating_culture": 3.5, "return_offer_rate": 58, "top_tags": ["Java", "AWS", "Python"], "ai_overview": "Amazon internship quality is highly team-dependent. LP culture is pervasive — prepare behavioral answers around the Leadership Principles. Some interns get incredible mentorship and real projects; others describe a more siloed experience. Strong comp and benefits."},
    {"name": "Microsoft", "industry": "Technology", "avg_rating": 4.3, "review_count": 1580, "rating_work": 4.2, "rating_mentorship": 4.5, "rating_compensation": 4.4, "rating_culture": 4.2, "return_offer_rate": 70, "top_tags": ["C#", "TypeScript", "Azure"], "ai_overview": "Microsoft internships have some of the best work-life balance in big tech. Teams are large but mentorship is structured and intentional. Azure and cloud roles are particularly strong. The culture is genuinely collaborative and less cutthroat than some peers."},
    {"name": "Airbnb", "industry": "Travel/Tech", "avg_rating": 4.4, "review_count": 193, "rating_work": 4.5, "rating_mentorship": 4.3, "rating_compensation": 4.6, "rating_culture": 4.4, "return_offer_rate": 71, "top_tags": ["Ruby", "React", "Kotlin"], "ai_overview": "Airbnb internships are known for strong engineering culture and real project ownership. Post-2022 they're a leaner org but more focused. The design culture is exceptional — even eng interns think in terms of user experience. Smaller intern class means more individual attention."},
    {"name": "Figma", "industry": "Design Tools", "avg_rating": 4.8, "review_count": 88, "rating_work": 4.9, "rating_mentorship": 4.8, "rating_compensation": 4.7, "rating_culture": 4.9, "return_offer_rate": 80, "top_tags": ["C++", "TypeScript", "WebGL"], "ai_overview": "Figma interns get exceptional exposure — tiny class, enormous company surface area. The technical bar is among the highest you'll find. Interns work on real product features with direct user impact. Culture is humble and collaborative. Extremely high would-return rate."},
    {"name": "Netflix", "industry": "Streaming", "avg_rating": 4.6, "review_count": 241, "rating_work": 4.7, "rating_mentorship": 4.4, "rating_compensation": 5.0, "rating_culture": 4.4, "return_offer_rate": 67, "top_tags": ["Java", "Python", "Spark"], "ai_overview": "Netflix takes the 'freedom and responsibility' culture seriously — no micromanagement, high expectations. Interns are treated as full engineers from day one. Compensation is the highest in the industry. Strong for data and distributed systems roles. Not for those who need structure."},
    {"name": "Uber", "industry": "Mobility", "avg_rating": 4.0, "review_count": 389, "rating_work": 4.2, "rating_mentorship": 3.9, "rating_compensation": 4.3, "rating_culture": 3.8, "return_offer_rate": 60, "top_tags": ["Go", "Python", "Kafka"], "ai_overview": "Uber internships are technically deep — distributed systems, real-time data, and scale problems everywhere. The engineering culture is strong. Team-to-team variance is significant. Strong for infra and data engineering roles."},
    {"name": "Snowflake", "industry": "Data/Cloud", "avg_rating": 4.5, "review_count": 134, "rating_work": 4.6, "rating_mentorship": 4.5, "rating_compensation": 4.4, "rating_culture": 4.4, "return_offer_rate": 73, "top_tags": ["C++", "Java", "Python"], "ai_overview": "Snowflake is excellent for data infrastructure roles. High-growth company with startup energy but enterprise stability. Interns work on real product features with strong mentorship. Technical bar is high, especially for core engineering roles."},
    {"name": "Databricks", "industry": "Data/AI", "avg_rating": 4.6, "review_count": 97, "rating_work": 4.7, "rating_mentorship": 4.5, "rating_compensation": 4.5, "rating_culture": 4.6, "return_offer_rate": 76, "top_tags": ["Scala", "Python", "Spark"], "ai_overview": "Databricks interns own real projects end to end. The company is at the intersection of open source and enterprise — interns often contribute to Apache Spark or Delta Lake directly. Very technical, fast-moving, strong eng culture."},
    {"name": "Palantir", "industry": "Data/Analytics", "avg_rating": 4.1, "review_count": 156, "rating_work": 4.4, "rating_mentorship": 4.0, "rating_compensation": 4.2, "rating_culture": 3.8, "return_offer_rate": 55, "top_tags": ["Java", "TypeScript", "Python"], "ai_overview": "Palantir internships are polarizing. The technical work is genuinely hard and interesting. The culture has a strong ideological flavor that some love and others find off-putting. Strong for those interested in data infrastructure and government/defense use cases."},
]

def seed():
    db = SessionLocal()
    try:
        existing = db.query(Company).count()
        if existing > 0:
            print(f"Database already has {existing} companies. Skipping seed.")
            return

        for c_data in COMPANIES:
            company = Company(**c_data)
            db.add(company)
        db.commit()
        print(f"Seeded {len(COMPANIES)} companies.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
