import React from 'react';
import { 
  SiJavascript, 
  SiTypescript, 
  SiReact, 
  SiMarkdown, 
  SiJson,
  SiHtml5,
  SiCss,
  SiPython,
  SiOpenjdk,
  SiCplusplus,
  SiSharp,
  SiPhp,
  SiRuby,
  SiGo,
  SiRust,
  SiSwift,
  SiKotlin,
  SiDart,
  SiYaml,
  SiDocker,
  SiGit,
  SiPostcss,
  SiSass,
  SiLess,
  SiPowers,
  SiGnubash
} from 'react-icons/si';
import { 
  FaFileAlt, 
  FaFileImage, 
  FaFileArchive, 
  FaFolder, 
  FaFolderOpen,
  FaFileCode,
  FaFilePdf,
  FaFileCsv,
  FaFileAudio,
  FaFileVideo
} from 'react-icons/fa';
import { VscSettingsGear } from 'react-icons/vsc';

/**
 * Returns an appropriate icon and color based on file extension.
 */
export const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  // Special full filenames
  if (fileName.toLowerCase() === 'dockerfile') return { icon: SiDocker, color: 'text-blue-400' };
  if (fileName.toLowerCase() === '.gitignore') return { icon: SiGit, color: 'text-orange-600' };
  if (fileName.toLowerCase() === '.env') return { icon: VscSettingsGear, color: 'text-yellow-600' };

  switch (ext) {
    // Web
    case 'html':
    case 'htm':
      return { icon: SiHtml5, color: 'text-orange-500' };
    case 'css':
      return { icon: SiCss, color: 'text-blue-500' };
    case 'scss':
    case 'sass':
      return { icon: SiSass, color: 'text-pink-400' };
    case 'less':
      return { icon: SiLess, color: 'text-blue-600' };
    case 'postcss':
      return { icon: SiPostcss, color: 'text-red-400' };

    // JavaScript / TypeScript / React
    case 'js':
    case 'mjs':
    case 'cjs':
      return { icon: SiJavascript, color: 'text-yellow-400' };
    case 'ts':
    case 'mts':
      return { icon: SiTypescript, color: 'text-blue-500' };
    case 'jsx':
    case 'tsx':
      return { icon: SiReact, color: 'text-blue-400' };

    // Programming Languages
    case 'py':
    case 'pyc':
    case 'pyd':
      return { icon: SiPython, color: 'text-blue-400' };
    case 'java':
    case 'jar':
      return { icon: SiOpenjdk, color: 'text-red-500' };
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return { icon: SiCplusplus, color: 'text-blue-600' };
    case 'cs':
      return { icon: SiSharp, color: 'text-purple-600' };
    case 'php':
      return { icon: SiPhp, color: 'text-indigo-400' };
    case 'rb':
      return { icon: SiRuby, color: 'text-red-600' };
    case 'go':
      return { icon: SiGo, color: 'text-blue-300' };
    case 'rs':
      return { icon: SiRust, color: 'text-orange-700' };
    case 'swift':
      return { icon: SiSwift, color: 'text-orange-500' };
    case 'kt':
    case 'kts':
      return { icon: SiKotlin, color: 'text-purple-500' };
    case 'dart':
      return { icon: SiDart, color: 'text-blue-400' };

    // Shell / Scripts
    case 'sh':
    case 'bash':
    case 'zsh':
      return { icon: SiGnubash, color: 'text-gray-300' };
    case 'ps1':
      return { icon: SiPowers, color: 'text-blue-400' };

    // Data / Config
    case 'json':
      return { icon: SiJson, color: 'text-yellow-500' };
    case 'yaml':
    case 'yml':
      return { icon: SiYaml, color: 'text-red-400' };
    case 'xml':
      return { icon: FaFileCode, color: 'text-orange-400' };
    case 'csv':
      return { icon: FaFileCsv, color: 'text-green-600' };

    // Documentation / Text
    case 'md':
    case 'mdx':
      return { icon: SiMarkdown, color: 'text-blue-300' };
    case 'txt':
    case 'log':
      return { icon: FaFileAlt, color: 'text-gray-400' };
    case 'pdf':
      return { icon: FaFilePdf, color: 'text-red-500' };

    // Media
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return { icon: FaFileImage, color: 'text-purple-400' };
    case 'mp3':
    case 'wav':
    case 'flac':
      return { icon: FaFileAudio, color: 'text-pink-400' };
    case 'mp4':
    case 'mov':
    case 'avi':
      return { icon: FaFileVideo, color: 'text-purple-500' };

    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: FaFileArchive, color: 'text-gray-400' };

    default:
      return { icon: FaFileAlt, color: 'text-gray-400' };
  }
};

/**
 * Returns folder icons based on expansion state.
 */
export const getFolderIcon = (isExpanded: boolean) => {
  return {
    icon: isExpanded ? FaFolderOpen : FaFolder,
    color: 'text-yellow-500'
  };
};
