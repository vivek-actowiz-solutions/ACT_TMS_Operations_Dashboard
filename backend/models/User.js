import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  originalPassword: { type: String, required: true },
  department: { type: String },
  designation:{type:String},
  role: { type: String,enum:["Admin", "Sales", "TL","Developer","Manager","SuperAdmin"] },
  reportingTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  slackId: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  
  
});

const User = mongoose.model('User', userSchema);

export default User;

export { userSchema };