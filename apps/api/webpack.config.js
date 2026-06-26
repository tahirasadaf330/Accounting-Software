module.exports = (options, webpack) => {
  return {
    ...options,
    externals: [
      ...(Array.isArray(options.externals) ? options.externals : []),
      { '@prisma/client': 'commonjs @prisma/client' },
    ],
  };
};
