require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seed...');

    // ==================== CREATE TABLES ====================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        goal_amount DECIMAL(12,2) DEFAULT 0,
        raised_amount DECIMAL(12,2) DEFAULT 0,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'draft',
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        total_donated DECIMAL(12,2) DEFAULT 0,
        donation_count INTEGER DEFAULT 0,
        last_donation_date DATE,
        segment VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(500),
        body TEXT,
        campaign_name VARCHAR(255),
        target_audience VARCHAR(255),
        tone VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        open_rate DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(100),
        content TEXT,
        campaign_name VARCHAR(255),
        hashtags TEXT,
        scheduled_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grants (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        funder VARCHAR(255),
        amount_requested DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        deadline DATE,
        proposal_text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        date DATE,
        location VARCHAR(500),
        budget DECIMAL(12,2) DEFAULT 0,
        expected_attendees INTEGER DEFAULT 0,
        goal_amount DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'planning',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS thank_you_letters (
        id SERIAL PRIMARY KEY,
        donor_name VARCHAR(255),
        donation_amount DECIMAL(12,2) DEFAULT 0,
        campaign_name VARCHAR(255),
        letter_text TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budget_items (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255),
        category VARCHAR(100),
        allocated_amount DECIMAL(12,2) DEFAULT 0,
        spent_amount DECIMAL(12,2) DEFAULT 0,
        roi_estimate VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        skills TEXT,
        availability VARCHAR(255),
        assigned_task VARCHAR(255),
        hours_contributed DECIMAL(8,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS impact_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        campaign_name VARCHAR(255),
        period VARCHAR(100),
        metrics_summary TEXT,
        report_text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ab_tests (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255),
        element_tested VARCHAR(255),
        variant_a TEXT,
        variant_b TEXT,
        winner VARCHAR(10),
        improvement_pct DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'draft',
        auto_rolled_out BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaign_donors (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        donor_id INTEGER REFERENCES donors(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        donated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, donor_id)
      );

      CREATE TABLE IF NOT EXISTS outreach_messages (
        id SERIAL PRIMARY KEY,
        donor_name VARCHAR(255),
        channel VARCHAR(100),
        message TEXT,
        campaign_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        sent_date TIMESTAMP,
        response TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255),
        target_amount DECIMAL(12,2) DEFAULT 0,
        suggested_amount DECIMAL(12,2) DEFAULT 0,
        rationale TEXT,
        timeline VARCHAR(255),
        status VARCHAR(50) DEFAULT 'proposed',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS content_calendar (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        content_type VARCHAR(100),
        channel VARCHAR(100),
        scheduled_date DATE,
        campaign_name VARCHAR(255),
        content_text TEXT,
        status VARCHAR(50) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tables created successfully.');

    // ==================== SEED DATA ====================

    // Demo user
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await client.query(
      `INSERT INTO users (email, password, name, organization) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['admin@fundraiser.org', hashedPassword, 'Sarah Mitchell', 'Hope Forward Foundation']
    );
    console.log('Demo user seeded.');

    // Campaigns (15+)
    const campaigns = [
      ['Year-End Giving Campaign 2025', 'Our flagship annual campaign to close the year strong with generosity. Help us reach families in need during the holiday season.', 150000, 87500, '2025-10-01', '2025-12-31', 'active', 'Annual Fund'],
      ['Clean Water for Rural Communities', 'Bringing sustainable clean water solutions to 12 rural villages in East Africa through well construction and filtration systems.', 250000, 175000, '2025-03-01', '2025-09-30', 'active', 'International'],
      ['Youth STEM Education Initiative', 'Providing underserved students ages 12-18 with hands-on STEM workshops, mentorship, and scholarship opportunities.', 75000, 42000, '2025-06-01', '2025-12-31', 'active', 'Education'],
      ['Emergency Disaster Relief Fund', 'Rapid response fund for communities affected by natural disasters. Provides shelter, food, and medical supplies.', 500000, 320000, '2025-01-01', '2025-12-31', 'active', 'Emergency'],
      ['Community Food Bank Expansion', 'Expanding our food bank operations to serve 5,000 additional families monthly with nutritious meals and groceries.', 120000, 65000, '2025-04-01', '2025-10-31', 'active', 'Hunger'],
      ['Arts & Culture Access Program', 'Making arts education and cultural experiences accessible to low-income youth through free workshops and museum partnerships.', 45000, 18000, '2025-07-01', '2026-01-31', 'active', 'Arts'],
      ['Senior Companion Program', 'Matching trained volunteers with isolated seniors for weekly companionship visits, reducing loneliness and improving wellbeing.', 35000, 12000, '2025-05-01', '2025-11-30', 'active', 'Health'],
      ['Green Spaces Initiative', 'Transforming vacant urban lots into community gardens and parks in underserved neighborhoods.', 90000, 55000, '2025-03-15', '2025-09-15', 'active', 'Environment'],
      ['Scholarship Fund Drive', 'Providing full-ride scholarships to first-generation college students from low-income backgrounds.', 200000, 110000, '2025-01-15', '2025-08-31', 'active', 'Education'],
      ['Mental Health Awareness Campaign', 'Destigmatizing mental health through community workshops, free counseling sessions, and educational resources.', 60000, 28000, '2025-06-01', '2025-12-31', 'active', 'Health'],
      ['Homeless Shelter Renovation', 'Renovating and expanding the downtown shelter to add 50 additional beds and a job training center.', 350000, 195000, '2025-02-01', '2025-11-30', 'active', 'Housing'],
      ['Literacy for All Initiative', 'Providing free books, tutoring, and reading programs to children in Title I schools across the district.', 55000, 33000, '2025-04-01', '2025-10-31', 'active', 'Education'],
      ['Animal Rescue & Adoption Drive', 'Supporting our no-kill shelter operations, veterinary care, and adoption events for rescued animals.', 40000, 22000, '2025-05-01', '2025-12-31', 'active', 'Animals'],
      ['Digital Inclusion Project', 'Distributing refurbished laptops and providing digital literacy training to underserved families.', 80000, 45000, '2025-07-01', '2026-03-31', 'active', 'Technology'],
      ['Giving Tuesday Blitz 2025', 'Our single-day giving event with corporate matching, social media challenges, and live-streamed impact stories.', 100000, 0, '2025-12-02', '2025-12-02', 'planned', 'Annual Fund'],
      ['Spring Gala Fundraiser', 'An elegant evening of dinner, dancing, and live auction to benefit our community programs.', 175000, 95000, '2025-04-15', '2025-04-15', 'completed', 'Events'],
    ];
    for (const c of campaigns) {
      await client.query(
        `INSERT INTO campaigns (name, description, goal_amount, raised_amount, start_date, end_date, status, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        c
      );
    }
    console.log('Campaigns seeded.');

    // Donors (20+)
    const donors = [
      ['Margaret Chen', 'margaret.chen@email.com', '(555) 234-5678', 25000, 15, '2025-09-15', 'Major Donor', 'Board member. Interested in education programs. Prefers personal calls.'],
      ['Robert & Linda Thompson', 'thompson.family@email.com', '(555) 345-6789', 52000, 24, '2025-10-01', 'Major Donor', 'Legacy donors since 2015. Passionate about clean water access.'],
      ['James Okafor', 'james.okafor@email.com', '(555) 456-7890', 8500, 10, '2025-08-22', 'Mid-Level', 'Corporate executive. Matches through employer. Interested in STEM education.'],
      ['Patricia Alvarez', 'p.alvarez@email.com', '(555) 567-8901', 3200, 8, '2025-07-10', 'Mid-Level', 'Monthly donor. Volunteers at food bank events. Active on social media.'],
      ['David Kim', 'david.kim@gmail.com', '(555) 678-9012', 1500, 5, '2025-06-30', 'Regular', 'Recurring donor. Engaged through email campaigns. Interested in arts.'],
      ['Sarah Washington', 'sarah.w@email.com', '(555) 789-0123', 750, 3, '2025-09-05', 'Regular', 'First-time major event attendee. Responded well to direct mail.'],
      ['Michael O\'Brien', 'mobrien@email.com', '(555) 890-1234', 15000, 12, '2025-10-10', 'Major Donor', 'Foundation president. Interested in housing and homelessness.'],
      ['Emily Nakamura', 'emily.n@email.com', '(555) 901-2345', 4800, 9, '2025-08-18', 'Mid-Level', 'Young professional donor. Engages through social media and peer-to-peer.'],
      ['William Foster', 'w.foster@email.com', '(555) 012-3456', 95000, 30, '2025-09-28', 'VIP', 'Philanthropist. Interested in large-scale impact projects. Prefers in-person meetings.'],
      ['Maria Rodriguez', 'maria.r@email.com', '(555) 123-4567', 2100, 6, '2025-07-25', 'Regular', 'Community member. Attends annual gala. Interested in youth programs.'],
      ['Thomas & Jane Williams', 'williams.family@email.com', '(555) 234-8901', 18000, 18, '2025-10-05', 'Major Donor', 'DAF donors. Interested in environmental programs.'],
      ['Aisha Patel', 'aisha.p@email.com', '(555) 345-9012', 6500, 11, '2025-09-12', 'Mid-Level', 'Healthcare professional. Interested in mental health initiatives.'],
      ['Christopher Lee', 'chris.lee@email.com', '(555) 456-0123', 900, 4, '2025-05-20', 'Regular', 'Recent college grad. Engages through digital channels.'],
      ['Barbara Martinez', 'b.martinez@email.com', '(555) 567-1234', 35000, 20, '2025-10-15', 'Major Donor', 'Retired educator. Passionate about literacy. Hosts donor circles.'],
      ['Daniel & Rebecca Park', 'parkfamily@email.com', '(555) 678-2345', 12000, 14, '2025-08-30', 'Major Donor', 'Business owners. Interested in digital inclusion.'],
      ['Jennifer Adams', 'j.adams@email.com', '(555) 789-3456', 500, 2, '2025-04-10', 'New', 'Acquired through Giving Tuesday. First donation in April.'],
      ['Richard Goldman', 'r.goldman@email.com', '(555) 890-4567', 150000, 25, '2025-09-20', 'VIP', 'Major philanthropist. Serves on advisory council.'],
      ['Susan Chang', 'susan.chang@email.com', '(555) 901-5678', 7200, 13, '2025-10-08', 'Mid-Level', 'Volunteer coordinator. Donates and contributes time regularly.'],
      ['Anthony Brooks', 'a.brooks@email.com', '(555) 012-6789', 1800, 7, '2025-06-15', 'Regular', 'Referred by Margaret Chen. Interested in animal welfare.'],
      ['Lisa Fernandez', 'lisa.f@email.com', '(555) 123-7890', 3500, 9, '2025-07-22', 'Mid-Level', 'Event sponsor. Local business owner. Interested in community development.'],
    ];
    for (const d of donors) {
      await client.query(
        `INSERT INTO donors (name, email, phone, total_donated, donation_count, last_donation_date, segment, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        d
      );
    }
    console.log('Donors seeded.');

    // Emails (15+)
    const emailSeeds = [
      ['Your Impact This Year: A Message from Our Director', 'Dear Friend, As we reflect on this incredible year...', 'Year-End Giving Campaign 2025', 'All Donors', 'warm', 'sent'],
      ['URGENT: Match Your Gift by Midnight!', 'Every dollar you give today will be DOUBLED...', 'Giving Tuesday Blitz 2025', 'Previous Donors', 'urgent', 'draft'],
      ['Meet Amara: The Girl Your Gift Helped', 'When Amara was 8, she walked 3 miles daily for dirty water...', 'Clean Water for Rural Communities', 'Major Donors', 'storytelling', 'sent'],
      ['You Are Invited: Spring Gala 2025', 'Join us for an unforgettable evening of impact...', 'Spring Gala Fundraiser', 'VIP Donors', 'formal', 'sent'],
      ['Monthly Update: Your Donations at Work', 'Here is what your generous support accomplished this month...', 'Community Food Bank Expansion', 'Monthly Donors', 'informative', 'sent'],
      ['Welcome to the Hope Forward Family!', 'Thank you for joining our mission. Here is what to expect...', 'Year-End Giving Campaign 2025', 'New Donors', 'welcoming', 'draft'],
      ['Last Chance: Scholarship Applications Closing', 'Help us fund the next generation of leaders...', 'Scholarship Fund Drive', 'Education Supporters', 'motivational', 'scheduled'],
      ['Breaking News: We Reached Our Water Well Goal!', 'Thanks to YOU, Village #8 now has clean water...', 'Clean Water for Rural Communities', 'All Donors', 'celebratory', 'sent'],
      ['A Special Request from a Volunteer', 'Hi, I am Tom, a volunteer at the shelter...', 'Homeless Shelter Renovation', 'Mid-Level Donors', 'personal', 'draft'],
      ['Why Your $25 Matters More Than You Think', 'Small gifts add up to life-changing impact...', 'Year-End Giving Campaign 2025', 'Small Donors', 'encouraging', 'draft'],
      ['Corporate Partnership Opportunities', 'Align your brand with transformative community impact...', 'Digital Inclusion Project', 'Corporate Partners', 'professional', 'draft'],
      ['Volunteer Spotlight: Meet Susan Chang', 'Susan has contributed over 200 hours this year...', 'Senior Companion Program', 'Volunteers', 'appreciative', 'sent'],
      ['Save the Date: Summer Block Party', 'Join us for food, fun, and fundraising...', 'Arts & Culture Access Program', 'Community Members', 'casual', 'scheduled'],
      ['End-of-Year Tax Reminder', 'Make your tax-deductible gift before December 31...', 'Year-End Giving Campaign 2025', 'All Donors', 'informative', 'draft'],
      ['Matching Gift Alert: Triple Your Impact', 'An anonymous donor will match every gift 3x...', 'Emergency Disaster Relief Fund', 'All Donors', 'exciting', 'draft'],
    ];
    for (const e of emailSeeds) {
      await client.query(
        `INSERT INTO emails (subject, body, campaign_name, target_audience, tone, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        e
      );
    }
    console.log('Emails seeded.');

    // Social Posts (15+)
    const socialPosts = [
      ['Twitter', 'Every child deserves clean water. We just built our 8th well! Help us reach 12 by year-end. #CleanWater #GiveHope', 'Clean Water for Rural Communities', '#CleanWater #GiveHope #NonprofitImpact', '2025-10-15 10:00:00', 'published'],
      ['Instagram', 'Meet Amara. Two months ago she walked 3 miles for water. Today, clean water flows in her village. This is your impact. Link in bio to help more communities like hers.', 'Clean Water for Rural Communities', '#WaterIsLife #ImpactStory #Nonprofit', '2025-10-16 14:00:00', 'published'],
      ['Facebook', 'EXCITING NEWS! Thanks to our amazing donors, we have raised $87,500 toward our Year-End Goal! Can you help us reach $150,000 by December 31? Every gift counts!', 'Year-End Giving Campaign 2025', '#YearEndGiving #HopeForward #Donate', '2025-10-20 12:00:00', 'scheduled'],
      ['LinkedIn', 'We are proud to announce our Digital Inclusion Project has distributed 500 laptops to underserved families. Technology access is a right, not a privilege.', 'Digital Inclusion Project', '#DigitalInclusion #TechForGood #SocialImpact', '2025-10-18 09:00:00', 'published'],
      ['Twitter', 'SAVE THE DATE: Giving Tuesday is December 2! Start planning your impact today. Every dollar will be matched! #GivingTuesday', 'Giving Tuesday Blitz 2025', '#GivingTuesday #GiveBack #Matching', '2025-11-15 08:00:00', 'draft'],
      ['Instagram', 'Our volunteers are incredible! Swipe to see the faces behind 10,000+ hours of service this year. We could not do it without them.', 'Senior Companion Program', '#VolunteerSpotlight #CommunityHeroes', '2025-10-22 16:00:00', 'draft'],
      ['Facebook', 'The Community Food Bank served 15,000 families this quarter! But the need is growing. Help us expand to serve 5,000 more families monthly.', 'Community Food Bank Expansion', '#FoodBank #HungerRelief #Community', '2025-10-25 11:00:00', 'scheduled'],
      ['Twitter', '1 in 5 students in our district reads below grade level. Our Literacy for All program is changing that, one book at a time. #LiteracyMatters', 'Literacy for All Initiative', '#LiteracyMatters #ReadToSucceed', '2025-10-12 09:30:00', 'published'],
      ['LinkedIn', 'Calling all corporate partners! Our Spring Gala raised $95,000 for community programs. Join us as a sponsor next year and multiply your impact.', 'Spring Gala Fundraiser', '#CorporateGiving #CSR #Partnership', '2025-10-28 10:00:00', 'draft'],
      ['Instagram', 'Before & After: This vacant lot is now a thriving community garden feeding 200 families. The Green Spaces Initiative is transforming neighborhoods.', 'Green Spaces Initiative', '#GreenSpaces #UrbanGarden #Community', '2025-10-30 15:00:00', 'draft'],
      ['Twitter', 'Mental health matters. Our free counseling program has helped 350 people this year. Break the stigma. Seek help. #MentalHealthAwareness', 'Mental Health Awareness Campaign', '#MentalHealth #BreakTheStigma', '2025-10-14 11:00:00', 'published'],
      ['Facebook', 'ADOPT, DO NOT SHOP! This Saturday we have 30 furry friends looking for forever homes. Join us at the Community Center from 10am-4pm.', 'Animal Rescue & Adoption Drive', '#AdoptDontShop #RescuePets #AnimalLove', '2025-11-01 09:00:00', 'scheduled'],
      ['Instagram', 'Our STEM students built their first robot this week! Your donations fund moments like these. Invest in the next generation of innovators.', 'Youth STEM Education Initiative', '#STEM #YouthEmpowerment #FutureLeaders', '2025-11-03 13:00:00', 'draft'],
      ['LinkedIn', 'Impact Report: Our Emergency Relief Fund has supported 12 disaster-affected communities this year, providing aid to over 8,000 families.', 'Emergency Disaster Relief Fund', '#DisasterRelief #HumanitarianAid', '2025-11-05 10:00:00', 'draft'],
      ['Twitter', 'The scholarship applications are rolling in! Help us fund dreams. A $5,000 gift sponsors one student for a full year. #EducationForAll', 'Scholarship Fund Drive', '#Scholarships #EducationForAll', '2025-11-07 08:30:00', 'draft'],
    ];
    for (const s of socialPosts) {
      await client.query(
        `INSERT INTO social_posts (platform, content, campaign_name, hashtags, scheduled_date, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        s
      );
    }
    console.log('Social posts seeded.');

    // Grants (15+)
    const grantSeeds = [
      ['Community Health Initiative Grant', 'Robert Wood Johnson Foundation', 75000, 'submitted', '2025-11-15', 'Proposal for expanding mental health counseling access in underserved communities.'],
      ['STEM Education Expansion', 'National Science Foundation', 150000, 'approved', '2025-09-30', 'Three-year program to bring robotics and coding workshops to Title I schools.'],
      ['Clean Water Infrastructure', 'Bill & Melinda Gates Foundation', 500000, 'submitted', '2025-12-01', 'Large-scale water purification and well construction project for rural East Africa.'],
      ['Urban Agriculture Development', 'USDA Community Food Projects', 85000, 'draft', '2026-01-15', 'Converting vacant urban lots into productive community gardens.'],
      ['Youth Arts Enrichment Program', 'National Endowment for the Arts', 50000, 'submitted', '2025-10-31', 'Providing free visual arts and music education to low-income youth.'],
      ['Digital Literacy Training', 'Google.org', 120000, 'approved', '2025-08-31', 'Comprehensive digital skills training program for seniors and underserved adults.'],
      ['Homeless Services Enhancement', 'HUD Continuum of Care', 250000, 'submitted', '2025-11-30', 'Expanding emergency shelter capacity and adding a job readiness program.'],
      ['Early Childhood Literacy', 'Dolly Parton Imagination Library', 30000, 'approved', '2025-10-15', 'Book distribution program for children ages 0-5 in the county.'],
      ['Environmental Education Program', 'EPA Environmental Education Grants', 45000, 'draft', '2026-02-28', 'Hands-on environmental science curriculum for middle school students.'],
      ['Senior Wellness Initiative', 'AARP Foundation', 60000, 'submitted', '2025-12-15', 'Holistic wellness program combining physical activity, nutrition, and social engagement.'],
      ['Disaster Preparedness Training', 'FEMA Preparedness Grants', 100000, 'draft', '2026-03-15', 'Community-wide disaster preparedness education and resource distribution.'],
      ['Animal Welfare Operations', 'PetSmart Charities', 35000, 'approved', '2025-09-15', 'Supporting spay/neuter programs and veterinary care for shelter animals.'],
      ['Refugee Resettlement Support', 'IRC Partnership Grant', 200000, 'submitted', '2025-11-01', 'Comprehensive resettlement services including housing, employment, and language training.'],
      ['College Access Program', 'Lumina Foundation', 90000, 'draft', '2026-01-31', 'First-generation college student support including counseling, test prep, and applications.'],
      ['Technology Infrastructure Upgrade', 'Salesforce.org', 45000, 'submitted', '2025-10-30', 'CRM and data management system upgrade for improved donor relations.'],
      ['Community Violence Intervention', 'Department of Justice', 175000, 'draft', '2026-04-30', 'Evidence-based violence intervention and prevention program for at-risk youth.'],
    ];
    for (const g of grantSeeds) {
      await client.query(
        `INSERT INTO grants (title, funder, amount_requested, status, deadline, proposal_text) VALUES ($1,$2,$3,$4,$5,$6)`,
        g
      );
    }
    console.log('Grants seeded.');

    // Events (15+)
    const eventSeeds = [
      ['Annual Spring Gala', 'gala', '2025-04-15', 'Grand Ballroom, Hilton Downtown', 25000, 300, 175000, 'completed', 'An elegant evening featuring dinner, live auction, and keynote speaker.'],
      ['5K Fun Run for Clean Water', 'race', '2025-06-20', 'Riverside Park', 5000, 500, 30000, 'completed', 'Family-friendly 5K race with proceeds benefiting clean water projects.'],
      ['Summer Block Party', 'community', '2025-07-15', 'Main Street Community Center', 3000, 200, 8000, 'completed', 'Free community celebration with food trucks, music, and donation stations.'],
      ['Back to School Supply Drive', 'drive', '2025-08-10', 'Multiple Locations', 2000, 150, 15000, 'completed', 'Collecting school supplies for underserved students.'],
      ['Harvest Dinner & Auction', 'dinner', '2025-10-25', 'The Farmstead Event Center', 15000, 200, 85000, 'active', 'Farm-to-table dinner with silent and live auctions.'],
      ['Giving Tuesday Livestream', 'virtual', '2025-12-02', 'Online', 1000, 1000, 100000, 'planning', '12-hour livestream event with donor challenges and impact stories.'],
      ['Holiday Gift Wrapping Station', 'community', '2025-12-15', 'Westfield Shopping Mall', 500, 50, 5000, 'planning', 'Volunteers wrap gifts for donations at the mall.'],
      ['New Year Benefit Concert', 'concert', '2025-12-31', 'City Concert Hall', 20000, 400, 60000, 'planning', 'Featuring local artists performing to ring in the new year for charity.'],
      ['Volunteer Appreciation Luncheon', 'appreciation', '2025-11-15', 'Community Center', 3000, 100, 0, 'planning', 'Honoring our dedicated volunteers with lunch and awards.'],
      ['Corporate Partner Breakfast', 'networking', '2025-11-08', 'Chamber of Commerce', 2500, 75, 25000, 'planning', 'Engaging corporate sponsors with impact presentations.'],
      ['Youth Talent Showcase', 'showcase', '2025-11-22', 'High School Auditorium', 1500, 250, 10000, 'planning', 'Students showcase talents developed through our programs.'],
      ['Charity Golf Tournament', 'sport', '2025-09-13', 'Pinehurst Country Club', 12000, 120, 50000, 'completed', 'Annual golf tournament with foursomes and hole sponsorships.'],
      ['Walk-a-Thon for Hunger', 'race', '2025-10-05', 'City Trail Loop', 3000, 300, 20000, 'active', 'Pledge-based walk raising funds for the food bank.'],
      ['Art Show & Wine Tasting', 'cultural', '2025-11-01', 'Downtown Art Gallery', 4000, 150, 15000, 'planning', 'Local artist exhibition with wine tasting and art sales.'],
      ['Phone-a-Thon Campaign Night', 'phone', '2025-11-20', 'Office HQ', 500, 30, 35000, 'planning', 'Volunteer phone bank reaching out to lapsed donors.'],
      ['Year-End Celebration Dinner', 'dinner', '2025-12-18', 'Marriott Grand Ballroom', 18000, 250, 120000, 'planning', 'Celebratory dinner recognizing top donors and year achievements.'],
    ];
    for (const e of eventSeeds) {
      await client.query(
        `INSERT INTO events (name, type, date, location, budget, expected_attendees, goal_amount, status, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        e
      );
    }
    console.log('Events seeded.');

    // Thank You Letters (15+)
    const thankYouSeeds = [
      ['Margaret Chen', 5000, 'Year-End Giving Campaign 2025', 'Dear Margaret, Your generous gift of $5,000 will help us reach families in need this holiday season. Your continued support as a board member means the world to us.', 'sent'],
      ['Robert & Linda Thompson', 10000, 'Clean Water for Rural Communities', 'Dear Robert and Linda, Your extraordinary gift of $10,000 will fund an entire water well for a village in need. You are literally giving the gift of life.', 'sent'],
      ['James Okafor', 2000, 'Youth STEM Education Initiative', 'Dear James, Thank you for your gift of $2,000 and your employer match! Together, $4,000 will provide STEM kits for an entire classroom.', 'sent'],
      ['Patricia Alvarez', 100, 'Community Food Bank Expansion', 'Dear Patricia, Your faithful monthly gift of $100 feeds 10 families every month. Thank you for being such a reliable partner in fighting hunger.', 'sent'],
      ['William Foster', 25000, 'Scholarship Fund Drive', 'Dear William, Your transformative gift of $25,000 will provide five full-year scholarships. You are opening doors that will change lives forever.', 'sent'],
      ['David Kim', 500, 'Arts & Culture Access Program', 'Dear David, Your gift of $500 will provide art supplies and museum field trips for 25 students. Thank you for supporting creativity.', 'draft'],
      ['Michael O\'Brien', 5000, 'Homeless Shelter Renovation', 'Dear Michael, Your generous contribution of $5,000 brings us closer to adding 50 new beds at the shelter. You are providing a safe place for families.', 'sent'],
      ['Emily Nakamura', 1000, 'Green Spaces Initiative', 'Dear Emily, Your gift of $1,000 will help us transform another vacant lot into a beautiful community garden. Thank you for growing hope.', 'draft'],
      ['Aisha Patel', 1500, 'Mental Health Awareness Campaign', 'Dear Aisha, As a healthcare professional, you understand the importance of mental health. Your $1,500 gift funds 15 free counseling sessions.', 'sent'],
      ['Barbara Martinez', 7500, 'Literacy for All Initiative', 'Dear Barbara, Your passion for literacy shines through your $7,500 gift. This will put 1,500 new books into the hands of eager young readers.', 'sent'],
      ['Daniel & Rebecca Park', 3000, 'Digital Inclusion Project', 'Dear Daniel and Rebecca, Your gift of $3,000 provides 6 refurbished laptops and digital training for families. You are bridging the digital divide.', 'draft'],
      ['Richard Goldman', 50000, 'Emergency Disaster Relief Fund', 'Dear Richard, Your extraordinary gift of $50,000 to our Emergency Fund ensures we can respond immediately when disaster strikes. Your leadership inspires others.', 'sent'],
      ['Susan Chang', 1000, 'Senior Companion Program', 'Dear Susan, Beyond your generous $1,000 donation, your 200+ volunteer hours have touched the lives of dozens of seniors. You are truly remarkable.', 'sent'],
      ['Anthony Brooks', 500, 'Animal Rescue & Adoption Drive', 'Dear Anthony, Your gift of $500 covers veterinary care for 5 rescued animals. Thank you for giving them a second chance at a loving home.', 'draft'],
      ['Lisa Fernandez', 2500, 'Spring Gala Fundraiser', 'Dear Lisa, Thank you for your generous sponsorship of $2,500 at the Spring Gala. Your support as a local business owner strengthens our entire community.', 'sent'],
      ['Jennifer Adams', 50, 'Year-End Giving Campaign 2025', 'Dear Jennifer, Welcome to the Hope Forward family! Your first gift of $50 joins thousands of others making real change. Every dollar matters.', 'sent'],
    ];
    for (const t of thankYouSeeds) {
      await client.query(
        `INSERT INTO thank_you_letters (donor_name, donation_amount, campaign_name, letter_text, status) VALUES ($1,$2,$3,$4,$5)`,
        t
      );
    }
    console.log('Thank you letters seeded.');

    // Budget Items (15+)
    const budgetSeeds = [
      ['Year-End Giving Campaign 2025', 'Digital Advertising', 8000, 5500, '3.2x', 'Google Ads and Facebook campaigns targeting year-end donors'],
      ['Year-End Giving Campaign 2025', 'Direct Mail', 12000, 9800, '2.8x', 'Printed appeal letters to 5,000 households'],
      ['Year-End Giving Campaign 2025', 'Email Marketing', 2000, 1200, '8.5x', 'Mailchimp platform and email design'],
      ['Clean Water for Rural Communities', 'Well Construction', 120000, 95000, '1.0x', 'Materials and labor for 8 water wells'],
      ['Clean Water for Rural Communities', 'Water Testing', 15000, 12000, '1.0x', 'Water quality testing equipment and lab fees'],
      ['Clean Water for Rural Communities', 'Travel & Logistics', 25000, 18000, '1.0x', 'International travel for project oversight'],
      ['Spring Gala Fundraiser', 'Venue & Catering', 15000, 14500, '5.8x', 'Hilton Grand Ballroom rental and dinner service'],
      ['Spring Gala Fundraiser', 'Entertainment', 5000, 4800, '5.8x', 'Live band and MC'],
      ['Spring Gala Fundraiser', 'Marketing & Invitations', 3000, 2800, '5.8x', 'Printed invitations and digital promotion'],
      ['Community Food Bank Expansion', 'Refrigeration Equipment', 25000, 22000, '1.5x', 'Industrial refrigerators and freezers'],
      ['Community Food Bank Expansion', 'Warehouse Space', 18000, 15000, '1.5x', 'Additional storage facility lease'],
      ['Community Food Bank Expansion', 'Transportation', 15000, 10000, '1.5x', 'Delivery van maintenance and fuel'],
      ['Youth STEM Education Initiative', 'Equipment & Supplies', 20000, 15000, '2.0x', 'Robotics kits, laptops, and lab materials'],
      ['Youth STEM Education Initiative', 'Instructor Salaries', 35000, 28000, '2.0x', 'Part-time STEM instructors and mentors'],
      ['Giving Tuesday Blitz 2025', 'Platform & Technology', 3000, 0, '15.0x', 'Livestream setup and donation platform'],
      ['Giving Tuesday Blitz 2025', 'Social Media Ads', 5000, 0, '12.0x', 'Targeted ads across all platforms'],
    ];
    for (const b of budgetSeeds) {
      await client.query(
        `INSERT INTO budget_items (campaign_name, category, allocated_amount, spent_amount, roi_estimate, notes) VALUES ($1,$2,$3,$4,$5,$6)`,
        b
      );
    }
    console.log('Budget items seeded.');

    // Volunteers (15+)
    const volunteerSeeds = [
      ['Tom Harrison', 'tom.h@email.com', 'Event planning, Public speaking, Leadership', 'Weekends', 'Gala Event Coordinator', 120, 'active'],
      ['Maya Singh', 'maya.s@email.com', 'Social media, Graphic design, Photography', 'Evenings', 'Social Media Manager', 85, 'active'],
      ['Carlos Ramirez', 'carlos.r@email.com', 'Construction, Plumbing, Electrical', 'Saturdays', 'Shelter Renovation Lead', 200, 'active'],
      ['Nicole Foster', 'nicole.f@email.com', 'Teaching, Tutoring, Curriculum development', 'Weekday afternoons', 'STEM Workshop Instructor', 150, 'active'],
      ['Kevin Wu', 'kevin.w@email.com', 'Data entry, Excel, Database management', 'Flexible', 'Database Volunteer', 60, 'active'],
      ['Amanda Mitchell', 'amanda.m@email.com', 'Cooking, Food service, Nutrition', 'Mornings', 'Food Bank Sorter', 95, 'active'],
      ['Derek Johnson', 'derek.j@email.com', 'Driving, Logistics, Warehouse', 'Full availability', 'Delivery Driver', 180, 'active'],
      ['Priya Sharma', 'priya.s@email.com', 'Counseling, Mental health, Active listening', 'Tuesdays and Thursdays', 'Senior Companion', 110, 'active'],
      ['Brandon Taylor', 'brandon.t@email.com', 'IT support, Computer repair, Networking', 'Weekends', 'Tech Support Volunteer', 75, 'active'],
      ['Rachel Kim', 'rachel.k@email.com', 'Writing, Editing, Grant writing', 'Flexible', 'Grant Writing Assistant', 90, 'active'],
      ['Marcus Brown', 'marcus.b@email.com', 'Gardening, Landscaping, Farming', 'Weekend mornings', 'Community Garden Lead', 130, 'active'],
      ['Sophia Nguyen', 'sophia.n@email.com', 'Veterinary care, Animal handling', 'Wednesdays and Saturdays', 'Animal Shelter Helper', 65, 'active'],
      ['Jacob Williams', 'jacob.w@email.com', 'Phone banking, Sales, Customer service', 'Evenings', 'Phone-a-Thon Caller', 40, 'active'],
      ['Emma Rodriguez', 'emma.r@email.com', 'Art, Music, Dance instruction', 'Weekday afternoons', 'Arts Program Instructor', 100, 'active'],
      ['Ryan O\'Connor', 'ryan.o@email.com', 'Finance, Accounting, Bookkeeping', 'Flexible', 'Finance Assistant', 55, 'active'],
      ['Zoe Chen', 'zoe.c@email.com', 'Translation, ESL teaching, Cultural liaison', 'Mornings', 'Refugee Support Volunteer', 70, 'active'],
    ];
    for (const v of volunteerSeeds) {
      await client.query(
        `INSERT INTO volunteers (name, email, skills, availability, assigned_task, hours_contributed, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        v
      );
    }
    console.log('Volunteers seeded.');

    // Impact Reports (15+)
    const impactSeeds = [
      ['Q3 2025 Impact Summary', 'Year-End Giving Campaign 2025', 'Q3 2025', 'Raised: $87,500 | Donors: 450 | New Donors: 85', 'Our Year-End campaign gained strong momentum in Q3 with 450 donors contributing $87,500 toward our $150,000 goal.'],
      ['Clean Water Project Milestone Report', 'Clean Water for Rural Communities', 'March-September 2025', 'Wells Built: 8 | People Served: 24,000 | Villages: 8', 'Eight communities now have access to clean water, transforming the lives of 24,000 people.'],
      ['STEM Education Annual Review', 'Youth STEM Education Initiative', 'Annual 2025', 'Students Served: 350 | Workshops: 48 | Mentors: 25', 'Our STEM program reached 350 students across 12 schools with hands-on robotics and coding workshops.'],
      ['Food Bank Quarterly Report', 'Community Food Bank Expansion', 'Q2 2025', 'Families Served: 15,000 | Meals Distributed: 180,000 | Volunteers: 120', 'The food bank served record numbers while expanding to two new distribution sites.'],
      ['Disaster Relief Response Summary', 'Emergency Disaster Relief Fund', 'January-September 2025', 'Communities Aided: 12 | Families Helped: 8,000 | Response Time: <48hrs', 'Rapid deployment to 12 disaster zones, providing immediate relief to over 8,000 families.'],
      ['Spring Gala Results', 'Spring Gala Fundraiser', 'April 2025', 'Raised: $95,000 | Attendees: 285 | Auction Items: 45', 'The Spring Gala exceeded expectations with $95,000 raised from 285 attendees.'],
      ['Senior Companion Program Update', 'Senior Companion Program', 'H1 2025', 'Seniors Paired: 45 | Visit Hours: 2,400 | Satisfaction: 98%', 'Our volunteers conducted over 2,400 companion visits with a 98% satisfaction rating.'],
      ['Green Spaces Progress Report', 'Green Spaces Initiative', 'March-September 2025', 'Gardens Created: 5 | Families Fed: 200 | Volunteers: 85', 'Five vacant lots transformed into productive community gardens serving 200 families.'],
      ['Scholarship Impact Report', 'Scholarship Fund Drive', 'Academic Year 2024-2025', 'Scholarships Awarded: 22 | GPA Average: 3.4 | Graduation Rate: 95%', 'Twenty-two first-generation students received full scholarships with a 95% retention rate.'],
      ['Mental Health Program Outcomes', 'Mental Health Awareness Campaign', 'H1 2025', 'Counseling Sessions: 350 | Workshops: 24 | Reach: 2,500', 'Free counseling sessions helped 350 individuals, with 24 community workshops reaching 2,500 people.'],
      ['Shelter Renovation Progress', 'Homeless Shelter Renovation', 'February-September 2025', 'Beds Added: 30 | Construction: 60% | Budget: On Track', 'Renovation progressing on schedule with 30 new beds already operational.'],
      ['Literacy Program Results', 'Literacy for All Initiative', 'H1 2025', 'Books Distributed: 8,500 | Reading Level Improvement: 1.5 grades | Students: 600', 'Students showed an average 1.5 grade-level improvement in reading after program participation.'],
      ['Animal Rescue Annual Stats', 'Animal Rescue & Adoption Drive', 'January-September 2025', 'Animals Rescued: 180 | Adopted: 145 | Spayed/Neutered: 200', 'Our no-kill shelter rescued 180 animals with an 80% adoption rate.'],
      ['Digital Inclusion Milestone', 'Digital Inclusion Project', 'Q1-Q3 2025', 'Laptops Distributed: 500 | Training Hours: 2,000 | Graduates: 300', '500 families now have computer access with 300 adults completing digital literacy training.'],
      ['Arts Program Showcase Report', 'Arts & Culture Access Program', 'Summer 2025', 'Students: 150 | Exhibitions: 3 | Performances: 5', '150 young artists participated in summer workshops culminating in 3 exhibitions and 5 performances.'],
    ];
    for (const i of impactSeeds) {
      await client.query(
        `INSERT INTO impact_reports (title, campaign_name, period, metrics_summary, report_text) VALUES ($1,$2,$3,$4,$5)`,
        i
      );
    }
    console.log('Impact reports seeded.');

    // AB Tests (15+)
    const abTestSeeds = [
      ['Year-End Giving Campaign 2025', 'Email Subject Line', 'Your Impact This Year', 'You Changed 500 Lives This Year', 'B', 23.5, 'completed'],
      ['Year-End Giving Campaign 2025', 'Donation Button Color', 'Blue (#2563EB)', 'Green (#16A34A)', 'B', 18.2, 'completed'],
      ['Year-End Giving Campaign 2025', 'Landing Page Hero Image', 'Group photo of beneficiaries', 'Single child portrait with quote', 'B', 31.0, 'completed'],
      ['Clean Water for Rural Communities', 'Ask Amount', '$50 / $100 / $250', '$25 / $75 / $150 / $500', 'B', 12.8, 'completed'],
      ['Clean Water for Rural Communities', 'Email CTA Text', 'Donate Now', 'Give Clean Water Today', 'B', 15.3, 'completed'],
      ['Giving Tuesday Blitz 2025', 'Social Media Ad Creative', 'Statistics infographic', 'Video testimonial', null, null, 'draft'],
      ['Giving Tuesday Blitz 2025', 'Email Send Time', 'Tuesday 8am', 'Tuesday 12pm', null, null, 'draft'],
      ['Community Food Bank Expansion', 'Direct Mail Format', 'Standard letter', 'Postcard with QR code', 'B', 8.5, 'completed'],
      ['Spring Gala Fundraiser', 'Invitation Design', 'Classic gold embossed', 'Modern minimalist', 'A', 5.2, 'completed'],
      ['Youth STEM Education Initiative', 'Facebook Ad Copy', 'Help fund STEM education', 'Every child deserves to learn to code', 'B', 22.0, 'completed'],
      ['Scholarship Fund Drive', 'Thank You Email Timing', 'Same day', 'Next morning', 'A', 11.0, 'completed'],
      ['Mental Health Awareness Campaign', 'Website Popup', 'Lightbox overlay', 'Slide-in sidebar', 'B', 14.7, 'completed'],
      ['Digital Inclusion Project', 'Landing Page Layout', 'Single column with video', 'Two column with stats', 'A', 9.3, 'completed'],
      ['Homeless Shelter Renovation', 'Peer-to-Peer Page Template', 'Photo-heavy template', 'Story-driven template', null, null, 'running'],
      ['Animal Rescue & Adoption Drive', 'Instagram Post Style', 'Professional photo', 'Candid/behind-the-scenes', 'B', 28.4, 'completed'],
    ];
    for (const a of abTestSeeds) {
      await client.query(
        `INSERT INTO ab_tests (campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        a
      );
    }
    console.log('AB tests seeded.');

    // Outreach Messages (15+)
    const outreachSeeds = [
      ['Margaret Chen', 'Phone', 'Hi Margaret, I wanted to personally thank you for your continued board service and discuss the Year-End campaign strategy.', 'Year-End Giving Campaign 2025', 'sent', '2025-09-20', 'Agreed to host a donor circle event in November'],
      ['William Foster', 'In-Person Meeting', 'Meeting at his office to discuss a major gift for the scholarship program and naming opportunity.', 'Scholarship Fund Drive', 'sent', '2025-09-25', 'Committed to $25,000 gift. Interested in naming a scholarship.'],
      ['Robert & Linda Thompson', 'Email', 'Dear Robert and Linda, I am thrilled to share that the water well you funded is now complete! Village #8 is celebrating.', 'Clean Water for Rural Communities', 'sent', '2025-09-28', 'Replied with congratulations. Considering additional gift.'],
      ['James Okafor', 'LinkedIn', 'James, I saw your company won the innovation award. Our STEM students would love to hear your story.', 'Youth STEM Education Initiative', 'sent', '2025-10-01', 'Agreed to be a guest speaker at STEM workshop'],
      ['Richard Goldman', 'Phone', 'Calling to discuss advisory council agenda and potential leadership gift for Year-End campaign.', 'Year-End Giving Campaign 2025', 'sent', '2025-10-05', 'Will consider $50,000 if matching is arranged'],
      ['Emily Nakamura', 'Instagram DM', 'Hi Emily! We loved your peer fundraising page. Would you be interested in being a campaign ambassador?', 'Green Spaces Initiative', 'sent', '2025-10-08', 'Excited to be ambassador. Will recruit 5 friends.'],
      ['Barbara Martinez', 'Personal Note', 'Handwritten note thanking her for hosting the reading circle and inviting her to the literacy celebration.', 'Literacy for All Initiative', 'sent', '2025-10-10', 'RSVP yes. Bringing 3 friends to the celebration.'],
      ['Daniel & Rebecca Park', 'Email', 'Sharing the Digital Inclusion Project impact report and inviting them to a laptop distribution event.', 'Digital Inclusion Project', 'sent', '2025-10-12', 'Will attend event. Considering increasing monthly gift.'],
      ['Aisha Patel', 'Email', 'Sharing mental health program outcomes and inviting her to serve on the program advisory committee.', 'Mental Health Awareness Campaign', 'draft', null, null],
      ['David Kim', 'Email', 'Inviting to exclusive donor preview of youth art exhibition.', 'Arts & Culture Access Program', 'draft', null, null],
      ['Susan Chang', 'Phone', 'Thanking for volunteer hours and discussing potential board nomination.', 'Senior Companion Program', 'scheduled', null, null],
      ['Lisa Fernandez', 'In-Person Meeting', 'Coffee meeting to discuss corporate sponsorship for upcoming events.', 'Year-End Giving Campaign 2025', 'scheduled', null, null],
      ['Thomas & Jane Williams', 'Email', 'Sharing environmental impact report and DAF giving guide for year-end.', 'Green Spaces Initiative', 'draft', null, null],
      ['Jennifer Adams', 'Email', 'Welcome series email #2 with impact stories and recurring giving option.', 'Year-End Giving Campaign 2025', 'sent', '2025-10-15', 'Opened email. Clicked on recurring giving link.'],
      ['Christopher Lee', 'Text', 'Hey Chris! Quick update: your gift helped fund 2 new robotics kits. Students are loving it!', 'Youth STEM Education Initiative', 'sent', '2025-10-14', 'Replied with thumbs up emoji. Shared on social media.'],
      ['Michael O\'Brien', 'Email', 'Shelter renovation progress photos and invitation to hard hat tour.', 'Homeless Shelter Renovation', 'sent', '2025-10-16', 'Confirmed for tour. Mentioned potential foundation grant.'],
    ];
    for (const o of outreachSeeds) {
      await client.query(
        `INSERT INTO outreach_messages (donor_name, channel, message, campaign_name, status, sent_date, response) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        o
      );
    }
    console.log('Outreach messages seeded.');

    // Goals (15+)
    const goalSeeds = [
      ['Year-End Giving Campaign 2025', 150000, 165000, 'Based on 10% growth from last year and expanded donor base.', '3 months (Oct-Dec)', 'active'],
      ['Clean Water for Rural Communities', 250000, 275000, 'Increased material costs require higher goal. Strong donor interest supports stretch.', '7 months', 'active'],
      ['Youth STEM Education Initiative', 75000, 80000, 'Program expansion to 3 new schools justifies increase.', '7 months', 'active'],
      ['Emergency Disaster Relief Fund', 500000, 500000, 'Maintain current level. Unpredictable nature makes increase risky.', '12 months', 'active'],
      ['Community Food Bank Expansion', 120000, 140000, 'Rising food costs and increased demand support higher goal.', '7 months', 'active'],
      ['Giving Tuesday Blitz 2025', 100000, 125000, 'Matching gift commitment and social media strategy support ambitious goal.', '1 day', 'proposed'],
      ['Spring Gala Fundraiser', 175000, 200000, 'Adding premium sponsor tier and expanding auction could yield 15% increase.', '1 event', 'completed'],
      ['Scholarship Fund Drive', 200000, 220000, 'Growing waitlist of qualified applicants. Board willing to match up to $20K.', '8 months', 'active'],
      ['Mental Health Awareness Campaign', 60000, 70000, 'Post-pandemic awareness driving donor interest in mental health.', '7 months', 'active'],
      ['Homeless Shelter Renovation', 350000, 350000, 'Construction costs locked in. Goal is firm per contractor estimates.', '10 months', 'active'],
      ['Literacy for All Initiative', 55000, 60000, 'Partnership with local library system enables expanded reach.', '7 months', 'active'],
      ['Animal Rescue & Adoption Drive', 40000, 45000, 'Veterinary costs increasing. New foster program needs funding.', '8 months', 'active'],
      ['Digital Inclusion Project', 80000, 95000, 'Corporate tech partner offering device matching. Higher goal is achievable.', '9 months', 'active'],
      ['Green Spaces Initiative', 90000, 100000, 'City offering matching funds for urban green projects.', '6 months', 'active'],
      ['Arts & Culture Access Program', 45000, 50000, 'Museum partnership reduces costs. Additional funds expand student spots.', '7 months', 'active'],
      ['Senior Companion Program', 35000, 38000, 'Modest increase to cover volunteer training and mileage reimbursement.', '7 months', 'active'],
    ];
    for (const g of goalSeeds) {
      await client.query(
        `INSERT INTO goals (campaign_name, target_amount, suggested_amount, rationale, timeline, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        g
      );
    }
    console.log('Goals seeded.');

    // Content Calendar (15+)
    const calendarSeeds = [
      ['Year-End Appeal Launch Email', 'email', 'Email', '2025-10-01', 'Year-End Giving Campaign 2025', 'Kick off the year-end campaign with an emotional appeal from the Executive Director.', 'published'],
      ['Clean Water Success Story Post', 'social_media', 'Instagram', '2025-10-05', 'Clean Water for Rural Communities', 'Photo carousel of completed well #8 with community celebration.', 'published'],
      ['Monthly Donor Newsletter', 'newsletter', 'Email', '2025-10-15', 'Year-End Giving Campaign 2025', 'October newsletter with campaign updates, impact stories, and upcoming events.', 'published'],
      ['STEM Workshop Recap Video', 'video', 'YouTube', '2025-10-18', 'Youth STEM Education Initiative', 'Short video showcasing students building robots at the latest workshop.', 'published'],
      ['Harvest Dinner Promo', 'social_media', 'Facebook', '2025-10-20', 'Year-End Giving Campaign 2025', 'Event promotion for the Harvest Dinner & Auction with early bird pricing.', 'scheduled'],
      ['Donor Spotlight Blog Post', 'blog', 'Website', '2025-10-22', 'Year-End Giving Campaign 2025', 'Feature story on the Thompson family and their decade of giving.', 'draft'],
      ['Food Bank Volunteer Call', 'social_media', 'Twitter', '2025-10-25', 'Community Food Bank Expansion', 'Call for volunteers for the holiday food distribution season.', 'scheduled'],
      ['Giving Tuesday Teaser', 'social_media', 'All Platforms', '2025-11-01', 'Giving Tuesday Blitz 2025', 'Save the date announcement with countdown graphics.', 'draft'],
      ['Impact Report Infographic', 'infographic', 'LinkedIn', '2025-11-05', 'Year-End Giving Campaign 2025', 'Visual summary of 2025 achievements across all programs.', 'draft'],
      ['Shelter Tour Video', 'video', 'YouTube', '2025-11-08', 'Homeless Shelter Renovation', 'Behind-the-scenes tour of the renovation progress.', 'draft'],
      ['GivingTuesday Email Series #1', 'email', 'Email', '2025-11-25', 'Giving Tuesday Blitz 2025', 'First in 3-part email series building excitement for Giving Tuesday.', 'draft'],
      ['GivingTuesday Email Series #2', 'email', 'Email', '2025-11-28', 'Giving Tuesday Blitz 2025', 'Second email with matching gift announcement and stories.', 'draft'],
      ['GivingTuesday Email Series #3', 'email', 'Email', '2025-12-01', 'Giving Tuesday Blitz 2025', 'Final reminder email sent evening before Giving Tuesday.', 'draft'],
      ['Year-End Tax Reminder', 'email', 'Email', '2025-12-15', 'Year-End Giving Campaign 2025', 'Reminder about tax-deductible giving deadline of December 31.', 'planned'],
      ['Holiday Gratitude Post', 'social_media', 'All Platforms', '2025-12-20', 'Year-End Giving Campaign 2025', 'Thank you post to all donors and volunteers with year highlights.', 'planned'],
      ['New Year Impact Preview', 'blog', 'Website', '2025-12-30', 'Year-End Giving Campaign 2025', 'Preview of 2026 plans and how donor support will drive next year goals.', 'planned'],
    ];
    for (const c of calendarSeeds) {
      await client.query(
        `INSERT INTO content_calendar (title, content_type, channel, scheduled_date, campaign_name, content_text, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        c
      );
    }
    console.log('Content calendar seeded.');

    console.log('\nDatabase seeding completed successfully!');
    console.log('Demo login users provisioned from the local environment.');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
