const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('csv-parse/sync');
const { DATASET_CONFIG } = require('../config/constants');

/**
 * Loads and parses the property dataset CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Array<Object>} Array of property records
 */
function loadDataset(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`Dataset file not found at ${filePath}`);
            return [];
        }

        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            console.warn(`Dataset file is empty at ${filePath}`);
            return [];
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        if (!fileContent || fileContent.trim().length === 0) {
            console.warn(`Dataset file content is empty at ${filePath}`);
            return [];
        }

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
                // Cast numeric columns
                if (context.column === 'surface_m2' || 
                    context.column === 'bedrooms' || 
                    context.column === 'location_score' ||
                    context.column === 'listing_price') {
                    return parseFloat(value) || 0;
                }
                if (context.column === 'is_booked') {
                    return parseInt(value, 10) || 0;
                }
                return value;
            }
        });

        console.log(`✓ Loaded ${records.length} records from dataset`);
        return records;
    } catch (error) {
        console.error('Error loading dataset:', error);
        return [];
    }
}

/**
 * Filters dataset by price range (for segmentation)
 * @param {Array<Object>} dataset - Array of property records
 * @param {number} minPrice - Minimum listing price
 * @param {number} maxPrice - Maximum listing price
 * @returns {Array<Object>} Filtered array of property records
 */
function filterDatasetByPrice(dataset, minPrice, maxPrice) {
    if (!dataset || dataset.length === 0) {
        return [];
    }
    
    return dataset.filter(record => {
        const price = record.listing_price || 0;
        return price >= minPrice && price <= maxPrice;
    });
}

/**
 * Calculates segmented occupancy rate (AOR) for a price range
 * @param {Array<Object>} filteredDataset - Filtered array of property records
 * @returns {number} Occupancy rate (0-1)
 */
function calculateSegmentedAOR(filteredDataset) {
    if (!filteredDataset || filteredDataset.length === 0) {
        return 0;
    }
    
    const totalBooked = filteredDataset.filter(record => record.is_booked === 1).length;
    return totalBooked / filteredDataset.length;
}

/**
 * Calculates statistics from the dataset
 * @param {Array<Object>} dataset - Array of property records
 * @returns {Object} Statistics object with averages and booking rate
 */
function calculateDatasetStats(dataset) {
    if (!dataset || dataset.length === 0) {
        return {
            avgSurface: 0,
            avgBedrooms: 0,
            avgLocationScore: 0,
            avgListingPrice: 0,
            bookingRate: 0,
            totalProperties: 0
        };
    }

    const stats = {
        totalProperties: dataset.length,
        avgSurface: 0,
        avgBedrooms: 0,
        avgLocationScore: 0,
        avgListingPrice: 0,
        bookingRate: 0
    };

    let totalBooked = 0;
    let totalSurface = 0;
    let totalBedrooms = 0;
    let totalLocationScore = 0;
    let totalListingPrice = 0;

    dataset.forEach(record => {
        if (record.is_booked === 1) totalBooked++;
        totalSurface += record.surface_m2 || 0;
        totalBedrooms += record.bedrooms || 0;
        totalLocationScore += record.location_score || 0;
        totalListingPrice += record.listing_price || 0;
    });

    stats.avgSurface = totalSurface / dataset.length;
    stats.avgBedrooms = totalBedrooms / dataset.length;
    stats.avgLocationScore = totalLocationScore / dataset.length;
    stats.avgListingPrice = totalListingPrice / dataset.length;
    stats.bookingRate = totalBooked / dataset.length;

    return stats;
}

/**
 * Downloads the dataset CSV from Google Drive
 * Handles redirects and Google Drive's download confirmation page
 * @param {string} filePath - Local path where to save the file
 * @returns {Promise<boolean>} True if download was successful
 */
function downloadDataset(filePath) {
    return new Promise((resolve, reject) => {
        const fileId = DATASET_CONFIG.GOOGLE_DRIVE_FILE_ID;
        const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const file = fs.createWriteStream(filePath);
        
        console.log(`Downloading dataset from Google Drive (File ID: ${fileId})...`);
        console.log(`URL: ${url}`);
        
        let downloadAttempts = 0;
        const maxAttempts = 3;
        
        const downloadFile = (downloadUrl, isRetry = false) => {
            downloadAttempts++;
            
            if (downloadAttempts > maxAttempts) {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(new Error('Max download attempts reached'));
                return;
            }
            
            https.get(downloadUrl, (response) => {
                console.log(`Response status: ${response.statusCode}, Content-Type: ${response.headers['content-type']}`);
                
                // Handle redirects
                if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        console.log(`Following redirect to: ${redirectUrl}`);
                        const absoluteUrl = redirectUrl.startsWith('http') 
                            ? redirectUrl 
                            : `https://drive.google.com${redirectUrl}`;
                        return downloadFile(absoluteUrl, true);
                    }
                }
                
                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('text/html')) {
                    console.log('Received HTML response, parsing for download link...');
                    let htmlData = '';
                    response.on('data', (chunk) => {
                        htmlData += chunk.toString();
                    });
                    response.on('end', () => {
                        const patterns = [
                            /href="([^"]*uc[^"]*export=download[^"]*)"/,
                            /href="([^"]*\/uc\?[^"]*export=download[^"]*)"/,
                            /id="uc-download-link"[^>]*href="([^"]*)"/,
                            /downloadUrl":"([^"]*)"/,
                        ];
                        
                        for (const pattern of patterns) {
                            const match = htmlData.match(pattern);
                            if (match && match[1]) {
                                let actualDownloadUrl = match[1].replace(/&amp;/g, '&');
                                if (!actualDownloadUrl.startsWith('http')) {
                                    actualDownloadUrl = `https://drive.google.com${actualDownloadUrl}`;
                                }
                                console.log(`Found download link: ${actualDownloadUrl}`);
                                return downloadFile(actualDownloadUrl, true);
                            }
                        }
                        
                        if (!isRetry) {
                            const confirmUrl = `${downloadUrl}&confirm=t`;
                            console.log(`Trying with confirm parameter: ${confirmUrl}`);
                            return downloadFile(confirmUrl, true);
                        }
                        
                        // Last resort: alternative download format
                        const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
                        console.log(`Trying alternative URL: ${altUrl}`);
                        return downloadFile(altUrl, true);
                    });
                    return;
                }
                
                if (response.statusCode !== 200) {
                    file.close();
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
                    return;
                }
                
                if (!contentType.includes('text/csv') && !contentType.includes('text/plain') && !contentType.includes('application/octet-stream')) {
                    console.warn(`Unexpected content type: ${contentType}`);
                }
                
                let totalBytes = 0;
                response.pipe(file);
                
                response.on('data', (chunk) => {
                    totalBytes += chunk.length;
                });
                
                file.on('finish', () => {
                    file.close();
                    const fileSize = fs.statSync(filePath).size;
                    console.log(`Downloaded ${totalBytes} bytes, file size: ${fileSize} bytes`);
                    
                    if (fileSize === 0) {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        reject(new Error('Downloaded file is empty'));
                        return;
                    }
                    
                    try {
                        const sample = fs.readFileSync(filePath, 'utf-8', { start: 0, end: 500 });
                        if (!sample.includes(',') && !sample.includes('\n')) {
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                            reject(new Error('Downloaded file does not appear to be a valid CSV'));
                            return;
                        }
                    } catch (err) {
                        console.warn('Could not verify CSV format:', err.message);
                    }
                    
                    console.log(`✓ Dataset downloaded successfully (${(fileSize / 1024).toFixed(2)} KB) to ${filePath}`);
                    resolve(true);
                });
            }).on('error', (err) => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                console.error(`✗ Error downloading dataset (attempt ${downloadAttempts}/${maxAttempts}):`, err.message);
                if (downloadAttempts < maxAttempts) {
                    setTimeout(() => {
                        console.log(`Retrying download...`);
                        downloadFile(url, true);
                    }, 1000);
                } else {
                    reject(err);
                }
            });
        };
        
        downloadFile(url);
    });
}

/**
 * Checks if the dataset file needs to be updated
 * @param {string} filePath - Path to the dataset file
 * @returns {boolean} True if file needs to be updated
 */
function needsUpdate(filePath) {
    if (!fs.existsSync(filePath)) {
        return true;
    }

    const stats = fs.statSync(filePath);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    
    return fileAge > DATASET_CONFIG.CACHE_DURATION;
}

/**
 * Ensures the dataset file exists and is up to date
 * Downloads from Google Drive if necessary
 * @param {string} filePath - Local path where to save/load the file
 * @returns {Promise<string>} Path to the dataset file
 */
async function ensureDataset(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            console.warn(`Dataset file is empty, deleting and re-downloading...`);
            fs.unlinkSync(filePath);
        }
    }

    if (needsUpdate(filePath)) {
        try {
            await downloadDataset(filePath);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.size === 0) {
                    fs.unlinkSync(filePath);
                    throw new Error('Downloaded file is empty');
                }
            }
        } catch (error) {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.size > 0) {
                    console.warn(`⚠ Using cached dataset (download failed: ${error.message})`);
                    return filePath;
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            throw error;
        }
    }

    return filePath;
}

/**
 * Gets the dataset file path, downloading from Google Drive if necessary
 * @returns {Promise<string|null>} Path to the dataset file or null if unavailable
 */
async function getDatasetPath() {
    const filePath = path.join(process.cwd(), DATASET_CONFIG.LOCAL_FILE_PATH);
    
    try {
        const finalPath = await ensureDataset(filePath);
        return finalPath;
    } catch (error) {
        console.error('Error ensuring dataset:', error.message);
        const possiblePaths = [
            path.join(__dirname, '../../data/dataset.csv'),
            path.join(__dirname, '../../dataset.csv'),
            path.join(process.cwd(), 'data', 'dataset.csv'),
            path.join(process.cwd(), 'dataset.csv')
        ];

        for (const fallbackPath of possiblePaths) {
            if (fs.existsSync(fallbackPath)) {
                return fallbackPath;
            }
        }

        return null;
    }
}

/**
 * Synchronous version of getDatasetPath for backward compatibility
 * @returns {string|null} Path to the dataset file or null if unavailable
 */
function getDatasetPathSync() {
    const possiblePaths = [
        path.join(process.cwd(), DATASET_CONFIG.LOCAL_FILE_PATH),
        path.join(__dirname, '../../data/dataset.csv'),
        path.join(__dirname, '../../dataset.csv'),
        path.join(process.cwd(), 'data', 'dataset.csv'),
        path.join(process.cwd(), 'dataset.csv')
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }

    return null;
}

module.exports = {
    loadDataset,
    calculateDatasetStats,
    filterDatasetByPrice,
    calculateSegmentedAOR,
    getDatasetPath,
    getDatasetPathSync,
    downloadDataset,
    ensureDataset,
    needsUpdate
};

