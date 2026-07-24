/**
 * EXIF Parser Module
 * Safe extraction and formatting of photo EXIF metadata
 */
class ExifParser {
  /**
   * Parse EXIF metadata from image file or ArrayBuffer
   * @param {File} file 
   * @returns {Promise<Object>} Formatted EXIF info
   */
  static async parseFile(file) {
    const result = {
      hasExif: false,
      dateTaken: null,
      cameraMake: '',
      cameraModel: '',
      lensModel: '',
      shutterSpeed: '',
      aperture: '',
      iso: '',
      focalLength: '',
      gpsLocation: '',
      rawExif: {}
    };

    try {
      if (typeof ExifReader === 'undefined') {
        console.warn('ExifReader library not loaded');
        return result;
      }

      const tags = await ExifReader.load(file, { expanded: true });
      result.rawExif = tags;

      const exifTags = tags.exif || {};
      const imageTags = tags.file || {};

      // 1. Date Taken Extraction
      if (exifTags.DateTimeOriginal) {
        result.dateTaken = this.parseExifDateString(exifTags.DateTimeOriginal.description);
      } else if (exifTags.DateTimeDigitized) {
        result.dateTaken = this.parseExifDateString(exifTags.DateTimeDigitized.description);
      } else if (exifTags.DateTime) {
        result.dateTaken = this.parseExifDateString(exifTags.DateTime.description);
      }

      // Fallback to File Last Modified Date if no EXIF Date
      if (!result.dateTaken && file.lastModified) {
        result.dateTaken = new Date(file.lastModified);
      }

      // 2. Camera Info
      if (exifTags.Make) {
        result.cameraMake = exifTags.Make.description.trim();
      }
      if (exifTags.Model) {
        result.cameraModel = exifTags.Model.description.trim();
      }

      // Clean up duplicates (e.g. Make: Sony, Model: SONY ILCE-7M4 -> Sony α7 IV or Sony ILCE-7M4)
      if (result.cameraMake && result.cameraModel.toLowerCase().startsWith(result.cameraMake.toLowerCase())) {
        // Model already contains Make
      }

      // 3. Lens Info
      if (exifTags.LensModel) {
        result.lensModel = exifTags.LensModel.description.trim();
      }

      // 4. Exposure Parameters (Shutter Speed, Aperture, ISO, Focal Length)
      if (exifTags.ExposureTime) {
        result.shutterSpeed = exifTags.ExposureTime.description;
      } else if (exifTags.ShutterSpeedValue) {
        result.shutterSpeed = exifTags.ShutterSpeedValue.description;
      }

      if (exifTags.FNumber) {
        result.aperture = `f/${exifTags.FNumber.value[0] / exifTags.FNumber.value[1]}`;
      } else if (exifTags.ApertureValue) {
        result.aperture = `f/${exifTags.ApertureValue.description}`;
      }

      if (exifTags.ISOSpeedRatings) {
        result.iso = `ISO ${exifTags.ISOSpeedRatings.description || exifTags.ISOSpeedRatings.value}`;
      }

      if (exifTags.FocalLength) {
        result.focalLength = `${exifTags.FocalLength.description}`;
      }

      // 5. GPS Location
      if (tags.gps && tags.gps.Latitude && tags.gps.Longitude) {
        const lat = tags.gps.Latitude;
        const lon = tags.gps.Longitude;
        result.gpsLocation = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
      }

      // Mark as having EXIF if any key fields present
      if (result.cameraModel || result.shutterSpeed || result.aperture || (exifTags.DateTimeOriginal)) {
        result.hasExif = true;
      }

    } catch (err) {
      console.log('No EXIF or error reading EXIF for file:', file.name, err);
      if (file.lastModified) {
        result.dateTaken = new Date(file.lastModified);
      }
    }

    return result;
  }

  /**
   * Helper to parse EXIF date string "YYYY:MM:DD HH:MM:SS" into JavaScript Date object
   * @param {string} dateStr 
   * @returns {Date|null}
   */
  static parseExifDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    // EXIF dates format is often "2026:07:24 19:20:15"
    const parts = dateStr.split(' ');
    if (parts.length >= 1) {
      const dateParts = parts[0].replace(/:/g, '-');
      const timePart = parts[1] || '00:00:00';
      const isoStr = `${dateParts}T${timePart}`;
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  /**
   * Format Date object according to format string template
   * @param {Date} dateObj 
   * @param {string} formatStr 
   * @returns {string}
   */
  static formatDate(dateObj, formatStr) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';

    const YYYY = dateObj.getFullYear();
    const YY = String(YYYY).slice(2);
    const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const DD = String(dateObj.getDate()).padStart(2, '0');
    const HH = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');

    switch (formatStr) {
      case 'YYYY-MM-DD HH:mm':
        return `${YYYY}-${MM}-${DD} ${HH}:${mm}`;
      case 'YYYY.MM.DD HH:mm':
        return `${YYYY}.${MM}.${DD} ${HH}:${mm}`;
      case 'YYYY/MM/DD':
        return `${YYYY}/${MM}/${DD}`;
      case 'YYYY年MM月DD日':
        return `${YYYY}年${MM}月${DD}日`;
      case "'YY MM DD":
        return `'${YY} ${MM} ${DD}`;
      case "'YY MM DD HH:mm":
        return `'${YY} ${MM} ${DD} ${HH}:${mm}`;
      default:
        return `${YYYY}-${MM}-${DD} ${HH}:${mm}`;
    }
  }
}

window.ExifParser = ExifParser;
