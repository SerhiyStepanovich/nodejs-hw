import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (req, res, next) => {
  const userId = req.user._id;

  if (!req.file) {
    return next(createHttpError(400, 'No file'));
  }

  try {
    const result = await saveFileToCloudinary(req.file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true, select: 'avatar' },
    );

    res.status(200).json({
      url: updatedUser.avatar,
    });
  } catch (error) {
    console.error(error);
    next(createHttpError(500, 'Failed to upload the avatar.'));
  }
};
