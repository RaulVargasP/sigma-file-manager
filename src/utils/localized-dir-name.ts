// SPDX-License-Identifier: GPL-3.0-or-later
// License: GNU GPLv3 or later. See the license file in the project root for more information.
// Copyright © 2021 - present Aleksey Hoffman. All rights reserved.

import normalizePath, { getPathLeafName } from '@/utils/normalize-path';
import type { UserPaths } from '@/data/user-paths';

export interface UserDirTitleKeysOptions {
  isMacos?: boolean;
  // On case-insensitive filesystems (macOS, Windows) the same directory can be
  // reached through differently-cased paths, so keys must be compared folded.
  caseFold?: boolean;
}

// Each well-known directory is only mapped when its on-disk leaf name matches
// the English name the OS gives it. This keeps the map self-correcting: on
// Linux, XDG dirs are already physically localized ("Escritorio"), so they
// won't match and keep their real name; macOS's ~/Movies picks the "movies"
// key while Windows' "Videos" folder picks "videos".
const userDirTitleKeys: Array<[keyof UserPaths, string, string]> = [
  ['desktopDir', 'Desktop', 'userDirs.desktop'],
  ['documentDir', 'Documents', 'userDirs.documents'],
  ['downloadDir', 'Downloads', 'userDirs.downloads'],
  ['pictureDir', 'Pictures', 'userDirs.pictures'],
  ['videoDir', 'Videos', 'userDirs.videos'],
  ['videoDir', 'Movies', 'userDirs.movies'],
  ['audioDir', 'Music', 'userDirs.music'],
  ['publicDir', 'Public', 'userDirs.public'],
];

export function normalizeDirPathKey(path: string, options: UserDirTitleKeysOptions = {}): string {
  const pathKey = normalizePath(path).replace(/\/+$/, '');
  return options.caseFold ? pathKey.toLowerCase() : pathKey;
}

// Well-known user directories are physically named in English on macOS and
// Windows ("Desktop", "Documents", ...); the OS file manager only translates
// them visually. This map lets the UI do the same without renaming anything.
export function buildUserDirTitleKeys(
  userPaths: Partial<UserPaths>,
  options: UserDirTitleKeysOptions = {},
): Map<string, string> {
  const titleKeysByPath = new Map<string, string>();
  const homePathKey = userPaths.homeDir ? normalizeDirPathKey(userPaths.homeDir, options) : '';

  function add(dirPath: string | undefined, expectedLeafName: string | null, titleKey: string) {
    if (!dirPath) {
      return;
    }

    if (expectedLeafName && getPathLeafName(dirPath) !== expectedLeafName) {
      return;
    }

    const pathKey = normalizeDirPathKey(dirPath, options);

    // Never relabel the home directory itself: a misconfigured XDG user dir
    // can point at $HOME, and its display name is the username, not "Public".
    if (!pathKey || pathKey === homePathKey) {
      return;
    }

    if (!titleKeysByPath.has(pathKey)) {
      titleKeysByPath.set(pathKey, titleKey);
    }
  }

  for (const [pathKey, expectedLeafName, titleKey] of userDirTitleKeys) {
    add(userPaths[pathKey], expectedLeafName, titleKey);
  }

  // Finder-only conventions; Explorer and Linux file managers never localize these.
  if (options.isMacos) {
    if (userPaths.homeDir) {
      const homeBase = normalizePath(userPaths.homeDir).replace(/\/+$/, '');
      add(`${homeBase}/Library`, null, 'userDirs.library');
    }

    add('/Applications', null, 'userDirs.applications');
  }

  return titleKeysByPath;
}
