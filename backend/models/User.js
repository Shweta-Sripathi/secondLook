const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema: Stores candidate & recruiter credentials, profiles, and roles.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter'],
      default: 'candidate',
      required: true
    },
    // Candidate profile fields
    profile: {
      college: { type: String, default: '' },
      degree: { type: String, default: '' },
      cgpa: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      skills: [{ type: String }],
      projects: [
        {
          name: { type: String },
          description: { type: String },
          techStack: { type: String },
          link: { type: String }
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save Mongoose hook: Hashes plain-text password using bcryptjs before saving document.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance Method: Compares entered plain-text password with stored bcrypt hash.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
