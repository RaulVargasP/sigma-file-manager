// SPDX-License-Identifier: GPL-3.0-or-later
// License: GNU GPLv3 or later. See the license file in the project root for more information.
// Copyright © 2021 - present Aleksey Hoffman. All rights reserved.

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserPathsStore } from '@/stores/storage/user-paths';
import { usePlatformStore } from '@/stores/runtime/platform';
import { buildUserDirTitleKeys, normalizeDirPathKey } from '@/utils/localized-dir-name';
import type { DirEntry } from '@/types/dir-entry';

export function useLocalizedDirName() {
  const { t } = useI18n();
  const userPathsStore = useUserPathsStore();
  const platformStore = usePlatformStore();

  const options = computed(() => ({
    isMacos: platformStore.isMacOS,
    caseFold: platformStore.isMacOS || platformStore.isWindows,
  }));

  const titleKeysByPath = computed(() => buildUserDirTitleKeys(userPathsStore.userPaths, options.value));

  function localizedDirName(path: string, fallbackName: string): string {
    const titleKey = titleKeysByPath.value.get(normalizeDirPathKey(path, options.value));
    return titleKey ? t(titleKey) : fallbackName;
  }

  function localizedEntryName(entry: Pick<DirEntry, 'name' | 'path' | 'is_dir'>): string {
    return entry.is_dir ? localizedDirName(entry.path, entry.name) : entry.name;
  }

  return {
    localizedDirName,
    localizedEntryName,
  };
}
