module.exports = (...funcs) => arg => {
  return funcs.reduce(async (res, func) => {
    return func(await res);
  }, arg);
};
