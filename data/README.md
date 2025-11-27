# Dataset Directory

This directory contains the property dataset CSV file for data-driven predictions.

## Automatic Download

**The dataset is automatically downloaded from Google Drive when the application starts.**

- **Source:** [Google Drive Public Link](https://drive.google.com/file/d/17zwQBXYvawGyM48jyVRSCrlXRubQ3Oa3/view)
- **File name:** `dataset.csv`
- **Location:** `data/dataset.csv` (created automatically)

## How It Works

1. **On First Run:** The application downloads the dataset from Google Drive automatically
2. **Cache Management:** The dataset is cached locally and updated every 24 hours
3. **Fallback:** If download fails, the application uses the cached file if available
4. **Manual Override:** You can place a `dataset.csv` file manually in this directory to override automatic download

## Dataset Format

The CSV file should have the following columns:

- `date` - Date of the record (format: YYYY-MM-DD)
- `property_id` - Unique property identifier
- `surface_m2` - Property surface area in square meters
- `bedrooms` - Number of bedrooms
- `location_score` - Location quality score (numeric)
- `listing_price` - Listing price (numeric, in euros)
- `is_booked` - Booking status (1 = booked, 0 = not booked)

## Example Row

```
date,property_id,surface_m2,bedrooms,location_score,listing_price,is_booked
2022-01-01,PROP_001,47,2,8,275,1
```

## Configuration

The dataset download behavior can be configured in `src/config/constants.js`:

- `DATASET_CONFIG.CACHE_DURATION`: How often to refresh the dataset (default: 24 hours)
- `DATASET_CONFIG.GOOGLE_DRIVE_FILE_ID`: The Google Drive file ID

## Notes

- If the dataset file cannot be downloaded, the application will continue to work but data-driven predictions will be disabled
- The dataset is loaded once at startup and cached in memory for performance
- The CSV file uses comma (`,`) as the delimiter and has a header row
- Network connectivity is required for the initial download

