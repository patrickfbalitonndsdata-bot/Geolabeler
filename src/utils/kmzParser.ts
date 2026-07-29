/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { KMZData, PlacemarkPin, KmlStyle } from '../types';

/**
 * Resolves all styles and style maps in a KML document to their respective Icon hrefs.
 */
export function resolveStylesAndIcons(xmlDoc: Document): Record<string, string> {
  const iconHrefMap: Record<string, string> = {};
  
  // 1. Process all <Style> elements
  const styleNodes = xmlDoc.getElementsByTagName('Style');
  for (let i = 0; i < styleNodes.length; i++) {
    const styleNode = styleNodes[i];
    const id = styleNode.getAttribute('id');
    if (!id) continue;
    
    const iconStyle = styleNode.getElementsByTagName('IconStyle')[0];
    if (iconStyle) {
      const icon = iconStyle.getElementsByTagName('Icon')[0];
      if (icon) {
        const hrefNode = icon.getElementsByTagName('href')[0];
        if (hrefNode && hrefNode.textContent) {
          iconHrefMap[id] = hrefNode.textContent.trim();
        }
      }
    }
  }
  
  // 2. Process all <StyleMap> elements to map them to their Style's icon
  const styleMapNodes = xmlDoc.getElementsByTagName('StyleMap');
  for (let i = 0; i < styleMapNodes.length; i++) {
    const styleMapNode = styleMapNodes[i];
    const id = styleMapNode.getAttribute('id');
    if (!id) continue;
    
    const pairs = styleMapNode.getElementsByTagName('Pair');
    let normalStyleUrl = '';
    let anyStyleUrl = '';
    
    for (let j = 0; j < pairs.length; j++) {
      const pair = pairs[j];
      const keyNode = pair.getElementsByTagName('key')[0];
      const styleUrlNode = pair.getElementsByTagName('styleUrl')[0];
      if (styleUrlNode && styleUrlNode.textContent) {
        const url = styleUrlNode.textContent.trim();
        anyStyleUrl = url;
        if (keyNode && keyNode.textContent?.trim() === 'normal') {
          normalStyleUrl = url;
        }
      }
    }
    
    const targetUrl = normalStyleUrl || anyStyleUrl;
    if (targetUrl) {
      const targetId = targetUrl.startsWith('#') ? targetUrl.substring(1) : targetUrl;
      if (iconHrefMap[targetId]) {
        iconHrefMap[id] = iconHrefMap[targetId];
      }
    }
  }
  
  return iconHrefMap;
}

/**
 * Gets the actual resolved icon href for a Placemark element.
 */
export function getPlacemarkIconHref(pm: Element, iconHrefMap: Record<string, string>): string {
  // Check styleUrl first
  const styleUrlNode = pm.getElementsByTagName('styleUrl')[0];
  if (styleUrlNode && styleUrlNode.textContent) {
    const styleUrl = styleUrlNode.textContent.trim();
    const styleId = styleUrl.startsWith('#') ? styleUrl.substring(1) : styleUrl;
    if (iconHrefMap[styleId]) {
      return iconHrefMap[styleId];
    }
  }
  
  // Check inline Style
  const iconStyle = pm.getElementsByTagName('IconStyle')[0];
  if (iconStyle) {
    const icon = iconStyle.getElementsByTagName('Icon')[0];
    if (icon) {
      const hrefNode = icon.getElementsByTagName('href')[0];
      if (hrefNode && hrefNode.textContent) {
        return hrefNode.textContent.trim();
      }
    }
  }
  
  return '';
}

/**
 * Detects the color of standard GE pushpins or paddles.
 */
export function detectPinColor(styleUrl: string, iconHref: string): string {
  const text = (styleUrl + '|' + iconHref).toLowerCase();
  
  if (text.includes('ylw') || text.includes('yellow')) return 'yellow';
  if (text.includes('ltblu') || text.includes('cyan') || text.includes('lightblue') || text.includes('palette-4') || text.includes('palette_4')) return 'cyan';
  if (text.includes('blue') || text.includes('blu') || text.includes('palette-3') || text.includes('palette_3')) return 'blue';
  if (text.includes('grn') || text.includes('green') || text.includes('palette-2') || text.includes('palette_2')) return 'green';
  if (text.includes('pink') || text.includes('palette-5') || text.includes('palette_5')) return 'pink';
  if (text.includes('purple') || text.includes('palette-6') || text.includes('palette_6')) return 'purple';
  if (text.includes('red') || text.includes('palette-1') || text.includes('palette_1')) return 'red';
  if (text.includes('wht') || text.includes('white') || text.includes('palette-7') || text.includes('palette_7')) return 'white';
  
  return 'unknown';
}

/**
 * Strips the study prefix from a pin name (e.g. ATR-001 -> 001).
 * It removes leading alphabets followed by standard separators.
 */
export function stripStudyPrefix(name: string): string {
  const stripped = name.replace(/^[a-zA-Z]+[-_ \s]+/, '');
  return stripped.trim() !== '' ? stripped : name;
}

/**
 * Checks if a pin is a camera/movie icon.
 */
export function isCameraIcon(name: string, iconHref: string): boolean {
  const nameLower = name.toLowerCase();
  const hrefLower = iconHref.toLowerCase();
  return nameLower.includes('cam ') || 
         nameLower.includes('cam-') || 
         nameLower.includes('cam_') || 
         nameLower.startsWith('cam') || 
         hrefLower.includes('movies') || 
         hrefLower.includes('camera') || 
         hrefLower.includes('video') || 
         hrefLower.includes('film');
}

/**
 * Checks if a pin is a standard pushpin or paddle icon from screenshots.
 */
export function isPushpinIcon(styleUrl: string, iconHref: string): boolean {
  const urlLower = styleUrl.toLowerCase();
  const hrefLower = iconHref.toLowerCase();
  
  // Standard colors for standard pushpin icons shown in the screenshot:
  // yellow (ylw), blue (blu), green (grn), cyan (ltblu), pink (pink), purple (purple), red (red), white (wht)
  const standardColors = [
    'ylw', 'yellow', 
    'blue', 'blu', 
    'grn', 'green', 
    'ltblu', 'cyan', 
    'pink', 
    'purple', 
    'red', 
    'wht', 'white'
  ];
  
  // Explicitly check for camera/movies/shapes to be completely safe
  if (hrefLower.includes('movies') || hrefLower.includes('camera') || hrefLower.includes('play') || hrefLower.includes('video') || hrefLower.includes('shapes') || hrefLower.includes('track') || hrefLower.includes('trail')) {
    return false;
  }
  
  // If there's an active icon href, it MUST be a pushpin or paddle
  if (hrefLower !== '') {
    const isPushpinOrPaddle = hrefLower.includes('pushpin') || 
                              hrefLower.includes('paddle') || 
                              hrefLower.includes('palette-') || 
                              hrefLower.includes('palette_');
    if (!isPushpinOrPaddle) {
      return false; // It has an active icon, and it's NOT a pushpin or paddle! (e.g. movies.png)
    }
    // Also must contain a standard color
    return standardColors.some(color => hrefLower.includes(color));
  }
  
  // If there is no active icon href resolved, we look at the styleUrl
  const hasPushpinStyle = urlLower.includes('pushpin') || 
                          urlLower.includes('paddle') || 
                          urlLower.includes('palette-') || 
                          urlLower.includes('palette_');
  if (!hasPushpinStyle) {
    return false;
  }
  return standardColors.some(color => urlLower.includes(color));
}

/**
 * Checks if a pin is a match based on targetStyle setting.
 */
export function checkIsMatch(styleUrl: string, iconHref: string, targetStyle: string, hasPointGeom: boolean, isCamera: boolean): boolean {
  // If this is a camera/movie icon, we MUST NOT match it for renaming.
  if (isCamera) {
    return false;
  }

  // If this Placemark is not a Point (e.g. it is a path, line, polygon, overlay, etc.), we MUST NEVER match it.
  if (!hasPointGeom) {
    return false;
  }

  const isGeneralMode = targetStyle.trim() === '' || 
                        targetStyle.toLowerCase() === 'pointstylemap20' || 
                        targetStyle.toLowerCase() === 'pushpin' ||
                        targetStyle.toLowerCase() === 'pins';
  
  if (isGeneralMode) {
    return isPushpinIcon(styleUrl, iconHref);
  }
  
  // Otherwise, match the specific targetStyle string
  return styleUrl.toLowerCase().includes(targetStyle.toLowerCase()) || 
         iconHref.toLowerCase().includes(targetStyle.toLowerCase());
}

/**
 * Helper to find the closest ancestor element with a specific tag name.
 */
export function getClosestAncestor(element: Element, tagName: string): Element | null {
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName === tagName) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Parses a KMZ file, extracts its KML files, and returns rich structured data about pins and styles.
 */
export async function parseKMZFile(
  file: File,
  targetStyle: string,
  projectId: string,
  renameCameras: boolean = false,
  cameraPrefix: string = '',
  useMultiProject: boolean = false,
  projectIds: string[] = [],
  stripStudy: boolean = false
): Promise<KMZData> {
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Find KML files in the archive
    const kmlFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.kml'));
    
    if (kmlFiles.length === 0) {
      throw new Error('Invalid KMZ file: No KML files found in the archive.');
    }
    
    // Use the first KML file found
    const kmlFileName = kmlFiles[0];
    const kmlText = await zip.files[kmlFileName].async('text');
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'application/xml');
    
    // Check for XML parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error(`Failed to parse XML in ${kmlFileName}: ${parserError[0].textContent}`);
    }
    
    // Resolve KML styles to find icon URLs
    const iconHrefMap = resolveStylesAndIcons(xmlDoc);
    
    // Retrieve all Placemark elements
    const placemarkNodes = xmlDoc.getElementsByTagName('Placemark');
    const pins: PlacemarkPin[] = [];
    const stylesMap: Record<string, number> = {};
    
    // Identify all unique folders containing pins (Placemarks with Point) in document order
    const uniqueFolders: Element[] = [];
    for (let i = 0; i < placemarkNodes.length; i++) {
      const pm = placemarkNodes[i];
      const hasPointGeom = pm.getElementsByTagName('Point').length > 0;
      if (!hasPointGeom) continue;
      
      const folder = getClosestAncestor(pm, 'Folder');
      if (folder && !uniqueFolders.includes(folder)) {
        uniqueFolders.push(folder);
      }
    }
    
    for (let i = 0; i < placemarkNodes.length; i++) {
      const pm = placemarkNodes[i];
      
      // Get pin name (label)
      const nameNode = pm.getElementsByTagName('name')[0];
      const name = nameNode ? nameNode.textContent || '' : 'Unnamed Pin';
      
      // Check if it has Point geometry
      const hasPointGeom = pm.getElementsByTagName('Point').length > 0;
      const isPathOrPolygon = pm.getElementsByTagName('LineString').length > 0 || 
                              pm.getElementsByTagName('Polygon').length > 0 ||
                              pm.getElementsByTagName('LinearRing').length > 0 ||
                              pm.getElementsByTagName('Model').length > 0 ||
                              pm.getElementsByTagName('GroundOverlay').length > 0;
      
      // Disregard non-point overlays/paths (like "Untitled Path") entirely from the pins list
      if (!hasPointGeom || isPathOrPolygon || name.toLowerCase().includes('untitled path')) {
        continue;
      }
      
      // Get style URL
      const styleUrlNode = pm.getElementsByTagName('styleUrl')[0];
      const styleUrl = styleUrlNode ? styleUrlNode.textContent || '' : '';
      
      // Get coordinates
      const coordNode = pm.getElementsByTagName('coordinates')[0];
      const coordinates = coordNode ? coordNode.textContent?.trim() || '' : undefined;
      
      // Get description
      const descNode = pm.getElementsByTagName('description')[0];
      const description = descNode ? descNode.textContent || '' : undefined;
      
      // Resolve actual icon href and color
      const iconHref = getPlacemarkIconHref(pm, iconHrefMap);
      const detectedColor = detectPinColor(styleUrl, iconHref);
      
      // Track style frequency
      if (styleUrl) {
        stylesMap[styleUrl] = (stylesMap[styleUrl] || 0) + 1;
      } else {
        stylesMap['(No Style)'] = (stylesMap['(No Style)'] || 0) + 1;
      }
      
      // Folder grouping & index identification
      const folderElement = getClosestAncestor(pm, 'Folder');
      let folderName = '';
      let folderIndex = -1;
      if (folderElement) {
        const fNameNode = folderElement.getElementsByTagName('name')[0];
        folderName = fNameNode ? fNameNode.textContent || '' : 'Unnamed Folder';
        folderIndex = uniqueFolders.indexOf(folderElement);
      }

      // Determine active project ID for this pin based on folder structure and settings
      let activeProjectId = projectId;
      if (useMultiProject) {
        if (folderIndex >= 0 && folderIndex < projectIds.length && projectIds[folderIndex].trim() !== '') {
          activeProjectId = projectIds[folderIndex].trim();
        } else {
          activeProjectId = ''; // No prefix if not provided for this folder
        }
      }

      // Determine match and preview name
      const isCamera = isCameraIcon(name, iconHref);
      let isMatch = false;
      let previewName = name;

      if (isCamera) {
        if (renameCameras && cameraPrefix.trim() !== '') {
          const cleanPrefix = cameraPrefix.trim();
          isMatch = true;
          if (!name.startsWith(`${cleanPrefix}-`)) {
            previewName = `${cleanPrefix}-${name}`;
          }
        }
      } else {
        isMatch = checkIsMatch(styleUrl, iconHref, targetStyle, hasPointGeom, isCamera);
        if (isMatch && activeProjectId.trim() !== '') {
          const cleanId = activeProjectId.trim();
          let baseName = name;
          if (stripStudy) {
            baseName = stripStudyPrefix(name);
          }
          if (!baseName.startsWith(`${cleanId}-`)) {
            previewName = `${cleanId}-${baseName}`;
          } else {
            previewName = baseName;
          }
        }
      }
      
      pins.push({
        id: `pin-${i}`,
        name,
        styleUrl,
        iconHref,
        detectedColor,
        hasPointGeom,
        isCamera,
        coordinates,
        description,
        isMatch,
        previewName,
        folderName,
        folderIndex,
      });
    }
    
    // Format unique styles list sorted by count descending
    const styles: KmlStyle[] = Object.entries(stylesMap)
       .map(([styleUrl, count]) => ({ styleUrl, count }))
       .sort((a, b) => b.count - a.count);
      
    return {
      fileName: file.name,
      fileSize: file.size,
      kmlFileName,
      pins,
      styles,
      zip,
      xmlDoc,
    };
  } catch (error) {
    console.error('Error parsing KMZ file:', error);
    throw error instanceof Error ? error : new Error('An error occurred while reading the KMZ file.');
  }
}

/**
 * Re-computes previews for already loaded pins based on new project id, multi-project, and target style settings.
 */
export function updatePinPreviews(
  pins: PlacemarkPin[],
  projectId: string,
  targetStyle: string,
  renameCameras: boolean = false,
  cameraPrefix: string = '',
  useMultiProject: boolean = false,
  projectIds: string[] = [],
  stripStudy: boolean = false
): PlacemarkPin[] {
  return pins.map(pin => {
    let isMatch = false;
    let previewName = pin.name;

    // Determine active project ID for this pin
    let activeProjectId = projectId;
    if (useMultiProject) {
      const folderIdx = pin.folderIndex !== undefined ? pin.folderIndex : -1;
      if (folderIdx >= 0 && folderIdx < projectIds.length && projectIds[folderIdx].trim() !== '') {
        activeProjectId = projectIds[folderIdx].trim();
      } else {
        activeProjectId = '';
      }
    }

    if (pin.isCamera) {
      if (renameCameras && cameraPrefix.trim() !== '') {
        const cleanPrefix = cameraPrefix.trim();
        isMatch = true;
        if (!pin.name.startsWith(`${cleanPrefix}-`)) {
          previewName = `${cleanPrefix}-${pin.name}`;
        }
      }
    } else {
      isMatch = checkIsMatch(pin.styleUrl, pin.iconHref, targetStyle, pin.hasPointGeom, pin.isCamera);
      if (isMatch && activeProjectId.trim() !== '') {
        const cleanId = activeProjectId.trim();
        let baseName = pin.name;
        if (stripStudy) {
          baseName = stripStudyPrefix(pin.name);
        }
        if (!baseName.startsWith(`${cleanId}-`)) {
          previewName = `${cleanId}-${baseName}`;
        } else {
          previewName = baseName;
        }
      }
    }
    
    return {
      ...pin,
      isMatch,
      previewName,
    };
  });
}

/**
 * Clones the XML Document and processes the rename, then zips it back up to KMZ and returns a Blob.
 */
export async function processAndGenerateKMZ(
  zip: JSZip,
  xmlDoc: Document,
  kmlFileName: string,
  projectId: string,
  targetStyle: string,
  renameCameras: boolean = false,
  cameraPrefix: string = '',
  useMultiProject: boolean = false,
  projectIds: string[] = [],
  stripStudy: boolean = false
): Promise<Blob> {
  // Clone the XML document to avoid modifying the original parsed in-memory instance
  const docClone = xmlDoc.cloneNode(true) as Document;
  
  // Resolve styles on the clone to find icon URLs
  const iconHrefMap = resolveStylesAndIcons(docClone);
  
  const placemarkNodes = docClone.getElementsByTagName('Placemark');
  const cleanId = projectId.trim();

  // Identify all unique folders containing point placemarks in document order inside clone
  const uniqueFolders: Element[] = [];
  for (let i = 0; i < placemarkNodes.length; i++) {
    const pm = placemarkNodes[i];
    const hasPointGeom = pm.getElementsByTagName('Point').length > 0;
    if (!hasPointGeom) continue;
    
    const folder = getClosestAncestor(pm, 'Folder');
    if (folder && !uniqueFolders.includes(folder)) {
      uniqueFolders.push(folder);
    }
  }

  // Rename folders in XML if multi-project option is enabled
  if (useMultiProject) {
    uniqueFolders.forEach((folderElement, index) => {
      if (index < projectIds.length && projectIds[index].trim() !== '') {
        const folderId = projectIds[index].trim();
        const fNameNode = folderElement.getElementsByTagName('name')[0];
        if (fNameNode) {
          fNameNode.textContent = folderId;
        }
      }
    });
  }
  
  for (let i = 0; i < placemarkNodes.length; i++) {
    const pm = placemarkNodes[i];
    
    const nameNode = pm.getElementsByTagName('name')[0];
    const nameText = nameNode ? nameNode.textContent || '' : '';
    
    // Filter out paths, polygons, overlays and anything containing "Untitled Path"
    const hasPointGeom = pm.getElementsByTagName('Point').length > 0;
    const isPathOrPolygon = pm.getElementsByTagName('LineString').length > 0 || 
                            pm.getElementsByTagName('Polygon').length > 0 ||
                            pm.getElementsByTagName('LinearRing').length > 0 ||
                            pm.getElementsByTagName('Model').length > 0 ||
                            pm.getElementsByTagName('GroundOverlay').length > 0;
    
    if (!hasPointGeom || isPathOrPolygon || nameText.toLowerCase().includes('untitled path')) {
      continue;
    }
    
    const styleUrlNode = pm.getElementsByTagName('styleUrl')[0];
    const styleUrlText = styleUrlNode ? styleUrlNode.textContent || '' : '';
    const iconHref = getPlacemarkIconHref(pm, iconHrefMap);
    const isCamera = isCameraIcon(nameText, iconHref);

    // Determine active project ID for this placemark
    let activeProjectId = cleanId;
    if (useMultiProject) {
      const folderElement = getClosestAncestor(pm, 'Folder');
      if (folderElement) {
        const folderIndex = uniqueFolders.indexOf(folderElement);
        if (folderIndex >= 0 && folderIndex < projectIds.length && projectIds[folderIndex].trim() !== '') {
          activeProjectId = projectIds[folderIndex].trim();
        } else {
          activeProjectId = '';
        }
      }
    }
    
    if (isCamera) {
      if (renameCameras && cameraPrefix.trim() !== '') {
        const cleanPrefix = cameraPrefix.trim();
        if (nameNode) {
          const originalName = nameText;
          if (!originalName.startsWith(`${cleanPrefix}-`)) {
            nameNode.textContent = `${cleanPrefix}-${originalName}`;
          }
        }
      }
    } else {
      if (checkIsMatch(styleUrlText, iconHref, targetStyle, hasPointGeom, isCamera)) {
        if (nameNode && activeProjectId !== '') {
          const originalName = nameText;
          let baseName = originalName;
          if (stripStudy) {
            baseName = stripStudyPrefix(originalName);
          }
          if (!baseName.startsWith(`${activeProjectId}-`)) {
            nameNode.textContent = `${activeProjectId}-${baseName}`;
          } else {
            nameNode.textContent = baseName;
          }
        }
      }
    }
  }
  
  // Serialize KML back to text string
  const serializer = new XMLSerializer();
  const modifiedKmlText = serializer.serializeToString(docClone);
  
  // Create a new JSZip or reuse the loaded zip but overwrite the KML
  const outputZip = new JSZip();
  
  // Copy all files from original zip except the KML file which we replace with the modified version
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename === kmlFileName) {
      outputZip.file(filename, modifiedKmlText);
    } else if (!zipEntry.dir) {
      const content = await zipEntry.async('blob');
      outputZip.file(filename, content);
    }
  }
  
  // Generate the zip blob
  return await outputZip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.google-earth.kmz',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
