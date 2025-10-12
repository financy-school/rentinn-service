export const getHostnameFromRegex = (url: string) => {
  // run against regex
  const matches = url.match(
    /^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im,
  );
  if (matches && matches[1].toLowerCase()) return matches[1].toLowerCase();
  return null;
};

export const isValidHostnameFromRegex = (hostname: string) => {
  const regex_obj = new RegExp(
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
  );
  return regex_obj.test(hostname);
};
