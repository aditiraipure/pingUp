export const DEFAULT_AVATAR = "/default-avatar.svg";

export const profileAvatar = (user) => user?.profile_picture || DEFAULT_AVATAR;
