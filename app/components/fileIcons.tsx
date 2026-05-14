import React from 'react';
import { 
  VscFile, 
  VscFolder, 
  VscFolderOpened,
  VscCode,
  VscJson,
  VscMarkdown,
  VscSymbolFile,
  VscDatabase,
  VscArchive,
  VscSettingsGear,
  VscTerminal,
  VscLock
} from 'react-icons/vsc';
import {
  SiTypescript,
  SiJavascript,
  SiReact,
  SiHtml5,
  SiCss,
  SiSass,
  SiLess,
  SiTailwindcss,
  SiSvg,
  SiDocker,
  SiNpm,
  SiYarn,
  SiPnpm,
  SiBun,
  SiVite,
  SiNextdotjs,
  SiAstro,
  SiPostcss,
  SiEslint,
  SiPrettier,
  SiBabel,
  SiGraphql,
  SiPrisma,
  SiPython,
  SiOpenjdk,
  SiKotlin,
  SiGo,
  SiRust,
  SiC,
  SiCplusplus,
  SiSharp,
  SiPhp,
  SiRuby,
  SiSwift,
  SiLua,
  SiYaml,
  SiJson,
  SiMarkdown
} from 'react-icons/si';

/**
 * Returns an appropriate icon and color based on file extension.
 * Using Vsc and Si icons for a consistent VS Code / Cursor aesthetic.
 */
export const getFileIcon = (fileName: string) => {
  const lowerFileName = fileName.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase();

  // Special full filenames
  if (lowerFileName === 'dockerfile') return { icon: SiDocker, color: 'icon-blue' };
  if (lowerFileName === 'docker-compose.yml' || lowerFileName === 'docker-compose.yaml') return { icon: SiDocker, color: 'icon-blue-light' };
  if (lowerFileName === '.gitignore') return { icon: VscSettingsGear, color: 'icon-orange-dark' };
  if (lowerFileName === '.dockerignore') return { icon: SiDocker, color: 'icon-gray' };
  if (lowerFileName === '.env' || lowerFileName.startsWith('.env.')) return { icon: VscSettingsGear, color: 'icon-yellow-dark' };
  if (lowerFileName === 'package.json') return { icon: SiNpm, color: 'icon-red' };
  if (lowerFileName === 'package-lock.json') return { icon: SiNpm, color: 'icon-orange-dark' };
  if (lowerFileName === 'yarn.lock') return { icon: SiYarn, color: 'icon-blue' };
  if (lowerFileName === 'pnpm-lock.yaml') return { icon: SiPnpm, color: 'icon-orange' };
  if (lowerFileName === 'bun.lockb') return { icon: SiBun, color: 'icon-yellow' };
  if (lowerFileName === 'tsconfig.json' || lowerFileName.startsWith('tsconfig.')) return { icon: SiTypescript, color: 'icon-blue' };
  if (lowerFileName === 'vite.config.ts' || lowerFileName === 'vite.config.js') return { icon: SiVite, color: 'icon-purple' };
  if (lowerFileName === 'next.config.js' || lowerFileName === 'next.config.ts' || lowerFileName === 'next.config.mjs') return { icon: SiNextdotjs, color: 'icon-gray' };
  if (lowerFileName === 'nuxt.config.ts' || lowerFileName === 'nuxt.config.js') return { icon: VscCode, color: 'icon-green' };
  if (lowerFileName === 'astro.config.mjs' || lowerFileName === 'astro.config.ts') return { icon: SiAstro, color: 'icon-orange' };
  if (lowerFileName === 'tailwind.config.js' || lowerFileName === 'tailwind.config.ts' || lowerFileName === 'tailwind.config.cjs') return { icon: SiTailwindcss, color: 'icon-blue-light' };
  if (lowerFileName === 'postcss.config.js' || lowerFileName === 'postcss.config.cjs') return { icon: SiPostcss, color: 'icon-orange-dark' };
  if (lowerFileName === 'eslint.config.js' || lowerFileName === 'eslint.config.mjs' || lowerFileName.startsWith('.eslintrc')) return { icon: SiEslint, color: 'icon-purple' };
  if (lowerFileName === '.prettierrc' || lowerFileName.startsWith('.prettierrc.')) return { icon: SiPrettier, color: 'icon-purple-light' };
  if (lowerFileName === 'babel.config.js' || lowerFileName === 'babel.config.json' || lowerFileName === '.babelrc') return { icon: SiBabel, color: 'icon-yellow' };
  if (lowerFileName === 'readme.md') return { icon: VscMarkdown, color: 'icon-blue' };
  if (lowerFileName === 'license') return { icon: VscFile, color: 'icon-gray' };

  switch (ext) {
    // Web & Styles
    case 'html':
    case 'htm':
      return { icon: SiHtml5, color: 'icon-orange' };
    case 'css':
      return { icon: SiCss, color: 'icon-blue' };
    case 'scss':
    case 'sass':
      return { icon: SiSass, color: 'icon-pink' };
    case 'less':
      return { icon: SiLess, color: 'icon-blue-dark' };
    case 'tailwind':
      return { icon: SiTailwindcss, color: 'icon-blue-light' };
    
    // JavaScript / TypeScript / React
    case 'js':
    case 'mjs':
    case 'cjs':
      return { icon: SiJavascript, color: 'icon-yellow' };
    case 'ts':
    case 'mts':
      return { icon: SiTypescript, color: 'icon-blue' };
    case 'jsx':
      return { icon: SiReact, color: 'icon-blue-light' };
    case 'tsx':
      return { icon: SiReact, color: 'icon-blue' };

    // Data / Config
    case 'json':
      return { icon: VscJson, color: 'icon-yellow' };
    case 'yaml':
    case 'yml':
      return { icon: SiYaml, color: 'icon-red' };
    case 'toml':
    case 'ini':
      return { icon: VscSettingsGear, color: 'icon-gray' };
    case 'xml':
      return { icon: VscCode, color: 'icon-orange-light' };
    case 'csv':
      return { icon: VscDatabase, color: 'icon-green' };
    case 'sql':
      return { icon: VscDatabase, color: 'icon-blue' };
    case 'graphql':
    case 'gql':
      return { icon: SiGraphql, color: 'icon-pink' };
    case 'prisma':
      return { icon: SiPrisma, color: 'icon-blue' };

    // Documentation / Text
    case 'md':
    case 'mdx':
      return { icon: VscMarkdown, color: 'icon-blue-light' };
    case 'txt':
    case 'log':
      return { icon: VscFile, color: 'icon-gray' };

    // Languages
    case 'py':
      return { icon: SiPython, color: 'icon-blue' };
    case 'java':
      return { icon: SiOpenjdk, color: 'icon-red' };
    case 'kt':
      return { icon: SiKotlin, color: 'icon-orange' };
    case 'go':
      return { icon: SiGo, color: 'icon-blue-light' };
    case 'rs':
      return { icon: SiRust, color: 'icon-orange-dark' };
    case 'c':
      return { icon: SiC, color: 'icon-blue' };
    case 'cpp':
      return { icon: SiCplusplus, color: 'icon-blue' };
    case 'cs':
      return { icon: SiSharp, color: 'icon-purple' };
    case 'php':
      return { icon: SiPhp, color: 'icon-purple' };
    case 'rb':
      return { icon: SiRuby, color: 'icon-red' };
    case 'swift':
      return { icon: SiSwift, color: 'icon-orange' };
    case 'lua':
      return { icon: SiLua, color: 'icon-blue' };
    
    // Shell
    case 'sh':
    case 'zsh':
    case 'fish':
    case 'bash':
      return { icon: VscTerminal, color: 'icon-gray' };

    // Media
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      if (ext === 'svg') return { icon: SiSvg, color: 'icon-orange' };
      return { icon: VscSymbolFile, color: 'icon-purple' };

    // Locks & Archives
    case 'lock':
      return { icon: VscLock, color: 'icon-gray' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: VscArchive, color: 'icon-gray' };

    default:
      return { icon: VscFile, color: 'icon-gray' };
  }
};

/**
 * Returns folder icons based on expansion state.
 */
export const getFolderIcon = (isExpanded: boolean) => {
  return {
    icon: isExpanded ? VscFolderOpened : VscFolder,
    color: 'icon-yellow'
  };
};
