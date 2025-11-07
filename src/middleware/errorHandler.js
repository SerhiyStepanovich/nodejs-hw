import createHttpError from 'http-errors';

const HttpError = createHttpError.HttpError;

export const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof HttpError) {
    const messageToDisplay = isProd
      ? 'Oops, we had an error, sorry 😞'
      : err.message || err.name;

    return res.status(err.status).json({
      message: messageToDisplay,
    });
  }

  const messageToDisplay = isProd
    ? 'Oops, we had an error, sorry 😞'
    : err.message;

  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    message: messageToDisplay,
  });
};
