"""
Seed script — populates the database with demo data for development.
Run: python seeds.py
"""
import sys
sys.path.insert(0, ".")

from app.database import init_db, SessionLocal
from app.models.user import User
from app.models.contact import Contact
from app.models.property import Property
from app.models.deal import Deal
from app.models.task import Task
from app.models.portfolio import Portfolio, PortfolioProperty
from app.routers.auth import hash_password


def seed():
    init_db()
    db = SessionLocal()

    if db.query(User).first():
        print("Database already seeded. Skipping.")
        return

    # ── Users ──
    user = User(
        id="demo-user-001",
        email="agent@douglasre.com",
        name="Active Amy",
        hashed_password=hash_password("password123"),
        role="agent",
        company="Douglas Real Estate",
    )
    db.add(user)

    investor = User(
        id="demo-user-002",
        email="investor@douglasre.com",
        name="Scaling Steve",
        hashed_password=hash_password("password123"),
        role="investor",
        company="Steve's Properties LLC",
    )
    db.add(investor)
    db.flush()
    print("✅ Users created")

    # ── Contacts ──
    contacts = [
        Contact(id="contact-001", owner_id=user.id, name="John Buyer",
                email="john@example.com", phone="555-0101",
                lead_source="zillow", lead_status="hot",
                property_of_interest="3BR Downtown Loft",
                budget_min=250000, budget_max=350000,
                notes="Looking for downtown property with parking"),
        Contact(id="contact-002", owner_id=user.id, name="Sarah Seller",
                email="sarah@example.com", phone="555-0102",
                lead_source="referral", lead_status="new",
                property_of_interest="Family Home in Suburbs",
                budget_min=400000, budget_max=600000),
        Contact(id="contact-003", owner_id=user.id, name="Mike Investor",
                email="mike@example.com", phone="555-0103",
                lead_source="open_house", lead_status="nurture",
                notes="Looking for multi-family investments"),
        Contact(id="contact-004", owner_id=user.id, name="Lisa Tenant",
                email="lisa@example.com", phone="555-0104",
                lead_source="website", lead_status="new",
                property_of_interest="2BR Apartment Rental"),
        Contact(id="contact-005", owner_id=investor.id, name="Bob Partner",
                email="bob@example.com", phone="555-0105",
                lead_source="referral", lead_status="qualifying",
                notes="Potential JV partner for fix-and-flip projects"),
    ]
    for c in contacts:
        db.add(c)
    db.flush()
    print("✅ Contacts created")
    # ── Properties ──
    properties = [
        Property(id="prop-001", owner_id=user.id,
                 street_address="123 Main St", city="Portland",
                 state="OR", zip_code="97201",
                 property_type="single_family", bedrooms=3, bathrooms=2.0,
                 square_feet=1500, lot_size=6500, year_built=2005,
                 list_price=450000, estimated_value=460000,
                 monthly_rent=2500, hoa_dues=0, status="active",
                 source="MLS", mls_number="MLS-12345"),
        Property(id="prop-002", owner_id=user.id,
                 street_address="456 Oak Ave", city="Portland",
                 state="OR", zip_code="97202",
                 property_type="condo", bedrooms=2, bathrooms=1.5,
                 square_feet=950, lot_size=0, year_built=2010,
                 list_price=285000, estimated_value=290000,
                 monthly_rent=1800, hoa_dues=250, status="active",
                 source="MLS", mls_number="MLS-67890"),
        Property(id="prop-003", owner_id=investor.id,
                 street_address="789 Pine Rd", city="Beaverton",
                 state="OR", zip_code="97005",
                 property_type="single_family", bedrooms=4, bathrooms=2.5,
                 square_feet=2000, lot_size=8500, year_built=1998,
                 list_price=520000, estimated_value=510000,
                 purchase_price=510000, monthly_rent=3200, hoa_dues=0,
                 status="active", source="MLS", mls_number="MLS-11111"),
        Property(id="prop-004", owner_id=investor.id,
                 street_address="321 Elm St", city="Portland",
                 state="OR", zip_code="97203",
                 property_type="multi_family", bedrooms=6, bathrooms=4.0,
                 square_feet=3200, lot_size=12000, year_built=1975,
                 list_price=680000, estimated_value=670000,
                 purchase_price=670000, monthly_rent=5500, hoa_dues=0,
                 status="active", source="MLS", mls_number="MLS-22222"),
        Property(id="prop-005", owner_id=user.id,
                 street_address="555 Cedar Ln", city="Lake Oswego",
                 state="OR", zip_code="97034",
                 property_type="single_family", bedrooms=5, bathrooms=3.0,
                 square_feet=2800, lot_size=10500, year_built=2018,
                 list_price=750000, estimated_value=755000,
                 monthly_rent=4000, hoa_dues=75, status="active",
                 source="Off Market", notes="Potential off-market deal"),
    ]
    for p in properties:
        db.add(p)
    db.flush()
    print("✅ Properties created")

    # ── Deals ──
    deals = [
        Deal(id="deal-001", user_id=user.id, contact_id="contact-001",
             property_id="prop-001", stage="showing", offer_price=445000,
             commission_rate=2.5, buyer_side=True,
             notes="Showing scheduled for this weekend"),
        Deal(id="deal-002", user_id=user.id, contact_id="contact-002",
             property_id="prop-005", stage="lead", buyer_side=False,
             notes="Potential listing appointment"),
        Deal(id="deal-003", user_id=user.id, contact_id="contact-001",
             property_id="prop-002", stage="offer", offer_price=282000,
             commission_rate=3.0, buyer_side=True,
             notes="Client interested in both properties"),
        Deal(id="deal-004", user_id=investor.id, contact_id="contact-005",
             property_id="prop-003", stage="under_contract",
             offer_price=515000, closing_price=513000,
             commission_rate=2.5, buyer_side=True,
             notes="Under contract! Inspections next week"),
    ]
    for d in deals:
        db.add(d)
    db.flush()
    print("✅ Deals created")
    # ── Tasks ──
    tasks = [
        Task(id="task-001", user_id=user.id, deal_id="deal-001",
             title="Send showing confirmation",
             description="Confirm Saturday 2pm showing for 123 Main St",
             status="todo", priority="high"),
        Task(id="task-002", user_id=user.id, deal_id="deal-001",
             title="Prepare market comps",
             description="Pull comps in the 97201 area for the showing",
             status="in_progress", priority="high"),
        Task(id="task-003", user_id=user.id, deal_id="deal-003",
             title="Draft counter-offer",
             description="Client wants to counter at $285,000",
             status="todo", priority="high"),
        Task(id="task-004", user_id=user.id, deal_id="deal-002",
             title="Prepare listing presentation",
             description="Create CMA and presentation for Sarah Seller",
             status="todo", priority="medium"),
        Task(id="task-005", user_id=user.id, contact_id="contact-003",
             title="Send market update to Mike Investor",
             description="Send multi-family listings in his price range",
             status="todo", priority="low"),
        Task(id="task-006", user_id=investor.id, deal_id="deal-004",
             title="Schedule home inspection",
             description="Book inspector for 789 Pine Rd",
             status="todo", priority="urgent"),
        Task(id="task-007", user_id=user.id,
             title="Monthly newsletter to past clients",
             description="Draft and send monthly market update",
             status="backlog", priority="low", is_recurring=True,
             recurring_interval="monthly"),
        Task(id="task-008", user_id=user.id, contact_id="contact-004",
             title="Follow up with Lisa Tenant",
             description="She inquired about 2BR rentals - send availabilities",
             status="todo", priority="medium"),
    ]
    for t in tasks:
        db.add(t)
    db.flush()
    print("✅ Tasks created")

    # ── Portfolios ──
    portfolio = Portfolio(
        id="portfolio-001", user_id=investor.id,
        name="Oregon Rental Portfolio",
        description="Steve's buy-and-hold properties in the Portland metro area",
        total_invested=1180000,
        total_equity=1250000,
        monthly_income=8700,
        monthly_expenses=2100,
    )
    db.add(portfolio)
    db.flush()

    # Link properties to portfolio
    links = [
        PortfolioProperty(id="pp-001", portfolio_id="portfolio-001",
                          property_id="prop-003", purchase_price=510000,
                          current_value=525000, equity=15000,
                          monthly_rent=3200, monthly_expenses=800),
        PortfolioProperty(id="pp-002", portfolio_id="portfolio-001",
                          property_id="prop-004", purchase_price=670000,
                          current_value=680000, equity=10000,
                          monthly_rent=5500, monthly_expenses=1300),
    ]
    for link in links:
        db.add(link)

    db.commit()
    db.close()
    print("✅ Portfolios created")
    print("\n🎉 Database seeded successfully!")
    print("   Agent login:     agent@douglasre.com / password123")
    print("   Investor login:  investor@douglasre.com / password123")


if __name__ == "__main__":
    seed()
