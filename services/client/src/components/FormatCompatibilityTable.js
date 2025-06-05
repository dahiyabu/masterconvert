import React, { useState } from 'react';
import { FileText, Image, Music, Video, Archive, Search, ChevronDown } from 'lucide-react';
import './FormatCompatibilityTable.css';

const FORMAT_COMPATIBILITY = {
  pdf: ['docx', 'txt', 'rtf', 'odt', 'png', 'jpg', 'xlsx', 'xls', 'pdf'],
  docx: ['pdf', 'txt', 'rtf', 'odt', 'docx'],
  txt: ['pdf', 'docx', 'rtf', 'odt', 'txt'],
  rtf: ['pdf', 'docx', 'txt', 'odt', 'rtf'],
  odt: ['pdf', 'docx', 'txt', 'rtf', 'odt'],
  xlsx: ['pdf', 'txt', 'rtf', 'odt', 'xls', 'xlsx'],
  xls: ['pdf', 'txt', 'rtf', 'odt', 'xlsx', 'xls'],
  jpg: ['png', 'webp', 'gif', 'svg', 'pdf', 'jpg'],
  jpeg: ['png', 'webp', 'gif', 'svg', 'pdf', 'jpeg'],
  png: ['jpg', 'webp', 'gif', 'svg', 'pdf', 'png'],
  svg: ['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'webp', 'svg'],
  webp: ['png', 'jpg', 'gif', 'webp'],
  gif: ['png', 'jpg', 'webp', 'mp4', 'gif'],
  mp4: ['mov', 'avi', 'webm', 'mkv', 'gif', 'mp4'],
  mov: ['mp4', 'avi', 'webm', 'mkv', 'mov'],
  avi: ['mp4', 'mov', 'webm', 'mkv', 'avi'],
  webm: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  mkv: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  mp3: ['wav', 'ogg', 'flac', 'aac', 'mp3'],
  wav: ['mp3', 'ogg', 'flac', 'aac', 'wav'],
  ogg: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
  flac: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  aac: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
  zip: ['rar', 'tar', '7z', 'zip'],
  rar: ['zip', 'tar', '7z', 'rar'],
  tar: ['zip', 'rar', '7z', 'tar'],
  '7z': ['zip', 'rar', 'tar', '7z'],
  iso: ['zip', 'tar', 'iso']
};

const getFormatIcon = (format) => {
  const imageFormats = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'];
  const videoFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  const archiveFormats = ['zip', 'rar', 'tar', '7z', 'iso'];
  
  if (imageFormats.includes(format)) return <Image className="format-icon-small" />;
  if (videoFormats.includes(format)) return <Video className="format-icon-small" />;
  if (audioFormats.includes(format)) return <Music className="format-icon-small" />;
  if (archiveFormats.includes(format)) return <Archive className="format-icon-small" />;
  return <FileText className="format-icon-small" />;
};

const getFormatColorClass = (format) => {
  const imageFormats = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'];
  const videoFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  const archiveFormats = ['zip', 'rar', 'tar', '7z', 'iso'];
  
  if (imageFormats.includes(format)) return 'format-bg-image';
  if (videoFormats.includes(format)) return 'format-bg-video';
  if (audioFormats.includes(format)) return 'format-bg-audio';
  if (archiveFormats.includes(format)) return 'format-bg-archive';
  return 'format-bg-document';
};

export default function FormatCompatibilityLookup() {
  const [selectedFormat, setSelectedFormat] = useState('');
  const formatList = Object.keys(FORMAT_COMPATIBILITY).sort();

  return (
    <div className="format-container">
      <div className="format-wrapper">
        {/* Header */}
        <div className="format-header">
          <div className="format-icon-container">
            <div className="format-icon-wrapper">
              <Search className="format-icon" />
            </div>
          </div>
          <h1 className="format-title">
            Format Compatibility
          </h1>
          <p className="format-subtitle">
            Discover which file formats work together seamlessly. Select a format to explore all compatible conversion options.
          </p>
        </div>

        {/* Main Content */}
        <div className="format-card">
          {/* Format Selector */}
          <div className="format-selector-container">
            <label className="format-label">
              Choose Your File Format
            </label>
            <div className="format-select-wrapper">
              <select
                className="format-select"
                onChange={(e) => setSelectedFormat(e.target.value)}
                value={selectedFormat}
              >
                <option value="">Select a file format...</option>
                {formatList.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="format-chevron" />
            </div>
          </div>

          {/* Results */}
          {selectedFormat && (
            <div className="format-results">
              {/* Selected Format Display */}
              <div className="format-selected-display">
                <div className="format-selected-badge">
                  {getFormatIcon(selectedFormat)}
                  <span className="format-selected-text">{selectedFormat.toUpperCase()}</span>
                </div>
              </div>

              {/* Compatible Formats Grid */}
              <div>
                <h3 className="format-compatible-header">
                  Compatible Formats ({FORMAT_COMPATIBILITY[selectedFormat].length})
                </h3>
                <div className="format-grid">
                  {FORMAT_COMPATIBILITY[selectedFormat].map((format, index) => (
                    <div
                      key={format}
                      className="format-item"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className={`format-item-bg ${getFormatColorClass(format)}`}></div>
                      <div className="format-item-content">
                        <div className="format-item-icon">
                          {getFormatIcon(format)}
                        </div>
                        <span className="format-item-text">
                          {format.toUpperCase()}
                        </span>
                      </div>
                      <div className="format-item-ring"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="format-stats">
                <div className="format-legend">
                  <div className="format-legend-item">
                    <div className="format-legend-dot emerald"></div>
                    <span>Images</span>
                  </div>
                  <div className="format-legend-item">
                    <div className="format-legend-dot purple"></div>
                    <span>Videos</span>
                  </div>
                  <div className="format-legend-item">
                    <div className="format-legend-dot orange"></div>
                    <span>Audio</span>
                  </div>
                  <div className="format-legend-item">
                    <div className="format-legend-dot gray"></div>
                    <span>Archives</span>
                  </div>
                  <div className="format-legend-item">
                    <div className="format-legend-dot blue"></div>
                    <span>Documents</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedFormat && (
            <div className="format-empty">
              <div className="format-empty-icon-wrapper">
                <Search className="format-empty-icon" />
              </div>
              <p className="format-empty-title">Ready to explore</p>
              <p className="format-empty-subtitle">Select a format above to see all compatible options</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}