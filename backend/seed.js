require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Resume = require('./models/Resume');
const College = require('./models/College');
const CollegeCutoff = require('./models/CollegeCutoff');
const UserSkill = require('./models/UserSkill');

// Demo Data Configuration
const seedData = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // 2. Clear Existing Data
    await User.deleteMany({});
    await Resume.deleteMany({});
    await College.deleteMany({});
    await CollegeCutoff.deleteMany({});
    await UserSkill.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // 3. Create Colleges
    const colleges = await College.insertMany([
      {
        name: "Indian Institute of Technology, Bombay",
        location: { city: "Mumbai", state: "Maharashtra", country: "India" },
        rating: 4.9,
        establishedYear: 1958,
        collegeType: "Public",
        averageFees: 220000,
        totalEnrollment: 10000,
        campusSize: "550 Acres",
        courses: ["Computer Science", "Electrical", "Mechanical", "Civil", "Aerospace"],
        facilities: ["Hostel", "Sports Complex", "Gym", "Library", "Labs"],
        image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400"
      },
      {
        name: "College of Engineering, Pune (COEP)",
        location: { city: "Pune", state: "Maharashtra", country: "India" },
        rating: 4.7,
        establishedYear: 1854,
        collegeType: "Public",
        averageFees: 85000,
        totalEnrollment: 4500,
        campusSize: "36 Acres",
        courses: ["Computer Engineering", "ENTC", "Mechanical", "Instrumentation"],
        facilities: ["Boat Club", "Hostel", "Auditorium", "Library"],
        image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400"
      },
      {
        name: "Vellore Institute of Technology",
        location: { city: "Vellore", state: "Tamil Nadu", country: "India" },
        rating: 4.5,
        establishedYear: 1984,
        collegeType: "Private",
        averageFees: 198000,
        totalEnrollment: 30000,
        campusSize: "372 Acres",
        courses: ["CSE", "IT", "Biotech", "Mechanical"],
        facilities: ["Swimming Pool", "Smart Classrooms", "Food Court", "Hostel"],
        image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400"
      }
    ]);
    console.log(`✅ Seeded ${colleges.length} Colleges`);

    // 4. Create Cutoff Predictions
    const cutoffs = await CollegeCutoff.insertMany([
      {
        college_name: "Indian Institute of Technology, Bombay",
        branch: "Computer Science",
        seat_type: "OPEN",
        score_type: "JEE(Main)",
        min: 99.5,
        max: 100,
        mean: 99.8,
        count: 50
      },
      {
        college_name: "College of Engineering, Pune (COEP)",
        branch: "Computer Engineering",
        seat_type: "GOPENS",
        score_type: "MHT-CET",
        min: 99.1,
        max: 99.9,
        mean: 99.4,
        count: 120
      },
      {
        college_name: "Vellore Institute of Technology",
        branch: "CSE",
        seat_type: "OPEN",
        score_type: "JEE(Main)",
        min: 90.0,
        max: 98.0,
        mean: 94.5,
        count: 500
      }
    ]);
    console.log(`✅ Seeded ${cutoffs.length} Cutoff Records`);

    // 5. Create a Demo User (FIXED: Added 'uid')
    const user = await User.create({
      uid: "demo-user-123", // <--- ADDED THIS LINE TO FIX ERROR
      name: "Rahul Sharma",
      email: "rahul@demo.com",
      password: "password123", 
      profile: {
        location: "Pune, India",
        educationLevel: "Undergraduate",
        targetRole: "Full Stack Developer"
      },
      savedColleges: [colleges[0]._id, colleges[1]._id]
    });
    console.log(`✅ Seeded User: ${user.name}`);

    // 6. Create Resume for User
    await Resume.create({
      userId: user._id,
      templateId: "modern",
      name: user.name,
      email: user.email,
      phone: "+91 9876543210",
      location: "Pune, Maharashtra",
      linkedin: "linkedin.com/in/rahulsharma",
      github: "github.com/rahulcode",
      summary: "Passionate developer with expertise in MERN stack.",
      skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
      experience: [
        {
          id: "1",
          company: "Tech Solutions Inc",
          position: "Frontend Intern",
          duration: "Jan 2023 - June 2023",
          description: "Built responsive UI components using React.js and Tailwind CSS."
        }
      ],
      education: [
        {
          id: "1",
          institution: "Pune University",
          degree: "B.E. Computer Engineering",
          year: "2024",
          grade: "8.8 CGPA"
        }
      ],
      achievements: ["Hackathon Winner 2023", "5 Star on HackerRank"],
      atsScore: 85
    });
    console.log(`✅ Seeded Resume for User`);

    // 7. Create User Skills
    await UserSkill.create({
      userId: user._id,
      targetCareer: "Full Stack Developer",
      skills: [
        { name: "JavaScript", level: 80, verified: true },
        { name: "React", level: 70, verified: true },
        { name: "Node.js", level: 50, verified: false },
        { name: "Python", level: 40, verified: false }
      ],
      assessments: [
        {
          skillName: "JavaScript",
          score: 80,
          date: new Date()
        }
      ]
    });
    console.log(`✅ Seeded User Skills`);

    console.log('🎉 Database Seeding Completed Successfully!');
    process.exit();

  } catch (error) {
    console.error('❌ Error Seeding Database:', error);
    process.exit(1);
  }
};

seedData();