/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export interface PlacemarkPin {
  id: string;
  name: string;
  styleUrl: string;
  iconHref: string;
  detectedColor: string; // e.g., 'yellow', 'blue', 'green', 'cyan', 'pink', 'purple', 'red', 'white', 'unknown'
  hasPointGeom: boolean;
  isCamera: boolean;
  coordinates?: string;
  description?: string;
  isMatch: boolean;
  previewName: string;
  folderName?: string;
  folderIndex?: number;
}

export interface KmlStyle {
  styleUrl: string;
  count: number;
}

export interface KMZData {
  fileName: string;
  fileSize: number;
  kmlFileName: string;
  pins: PlacemarkPin[];
  styles: KmlStyle[];
  zip: JSZip;
  xmlDoc: Document;
}
