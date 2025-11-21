import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
  {
    username: { type: String, trim: true },
    email: { type: String, trim: true, unique: true, required: true },
    password: { type: String, required: true, minlength: 8 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.username) {
      this.username = this.email;
    }

    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
  next();
});

userSchema.method.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.pasword;
  return userObject;
};

export const User = model('User', userSchema);
