// SPDX-License-Identifier: GPL-3.0-or-later
// License: GNU GPLv3 or later. See the license file in the project root for more information.
// Copyright © 2021 - present Aleksey Hoffman. All rights reserved.

import { describe, it, expect } from 'vitest';
import { buildUserDirTitleKeys, normalizeDirPathKey } from '../localized-dir-name';

const macUserPaths = {
  homeDir: '/Users/user',
  desktopDir: '/Users/user/Desktop',
  documentDir: '/Users/user/Documents',
  downloadDir: '/Users/user/Downloads',
  pictureDir: '/Users/user/Pictures',
  videoDir: '/Users/user/Movies',
  audioDir: '/Users/user/Music',
  publicDir: '/Users/user/Public',
};

const macOptions = {
  isMacos: true,
  caseFold: true,
};

describe('normalizeDirPathKey', () => {
  it('normalizes backslashes and strips trailing slashes', () => {
    expect(normalizeDirPathKey('C:\\Users\\user\\Desktop\\')).toBe('C:/Users/user/Desktop');
    expect(normalizeDirPathKey('/Users/user/Desktop/')).toBe('/Users/user/Desktop');
    expect(normalizeDirPathKey('/Users/user/Desktop')).toBe('/Users/user/Desktop');
  });

  it('folds case only when requested', () => {
    expect(normalizeDirPathKey('/Users/User/Desktop', { caseFold: true })).toBe('/users/user/desktop');
    expect(normalizeDirPathKey('/Users/User/Desktop')).toBe('/Users/User/Desktop');
  });
});

describe('buildUserDirTitleKeys', () => {
  it('maps well-known macOS user directories to userDirs title keys', () => {
    const titleKeys = buildUserDirTitleKeys(macUserPaths, macOptions);

    expect(titleKeys.get('/users/user/desktop')).toBe('userDirs.desktop');
    expect(titleKeys.get('/users/user/documents')).toBe('userDirs.documents');
    expect(titleKeys.get('/users/user/downloads')).toBe('userDirs.downloads');
    expect(titleKeys.get('/users/user/pictures')).toBe('userDirs.pictures');
    expect(titleKeys.get('/users/user/movies')).toBe('userDirs.movies');
    expect(titleKeys.get('/users/user/music')).toBe('userDirs.music');
    expect(titleKeys.get('/users/user/public')).toBe('userDirs.public');
    expect(titleKeys.get('/users/user/library')).toBe('userDirs.library');
    expect(titleKeys.get('/applications')).toBe('userDirs.applications');
  });

  it('uses the videos key when the video directory is physically named Videos', () => {
    const titleKeys = buildUserDirTitleKeys({
      videoDir: 'C:\\Users\\user\\Videos',
    }, { caseFold: true });

    expect(titleKeys.get('c:/users/user/videos')).toBe('userDirs.videos');
  });

  it('does not map the home directory itself', () => {
    const titleKeys = buildUserDirTitleKeys(macUserPaths, macOptions);
    expect(titleKeys.has('/users/user')).toBe(false);
  });

  it('does not map a user directory pointed at the home directory', () => {
    const titleKeys = buildUserDirTitleKeys({
      homeDir: '/Users/user',
      desktopDir: '/Users/user/Desktop',
      publicDir: '/Users/user',
    }, macOptions);

    expect(titleKeys.has('/users/user')).toBe(false);
    expect(titleKeys.get('/users/user/desktop')).toBe('userDirs.desktop');
  });

  it('does not map directories whose physical leaf name is already localized', () => {
    const titleKeys = buildUserDirTitleKeys({
      homeDir: '/home/user',
      desktopDir: '/home/user/Escritorio',
      downloadDir: '/home/user/Downloads',
    });

    expect(titleKeys.has('/home/user/Escritorio')).toBe(false);
    expect(titleKeys.get('/home/user/Downloads')).toBe('userDirs.downloads');
  });

  it('excludes Library and Applications outside macOS', () => {
    const titleKeys = buildUserDirTitleKeys({
      homeDir: '/home/user',
      desktopDir: '/home/user/Desktop',
    });

    expect(titleKeys.has('/home/user/Library')).toBe(false);
    expect(titleKeys.has('/Applications')).toBe(false);
  });

  it('skips unresolved (empty) paths', () => {
    const titleKeys = buildUserDirTitleKeys({
      desktopDir: '/Users/user/Desktop',
      documentDir: '',
    });

    expect(titleKeys.get('/Users/user/Desktop')).toBe('userDirs.desktop');
    expect([...titleKeys.keys()].some(key => key === '')).toBe(false);
  });

  it('does not map unrelated directories with the same leaf name', () => {
    const titleKeys = buildUserDirTitleKeys(macUserPaths, macOptions);
    expect(titleKeys.has('/users/user/projects/desktop')).toBe(false);
  });
});
