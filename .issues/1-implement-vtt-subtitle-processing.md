# Implement VTT/Subtitle Processing for Timestamp Extraction

## Description
Currently, our video processing pipeline estimates chapter timestamps based on text position in the transcript. We need to enhance this by extracting and using timestamps from VTT or SRT subtitle files for more accurate chapter boundaries.

## Technical Requirements
1. Add functionality to extract subtitles from video files using ffmpeg
2. Implement VTT/SRT parsing to extract timestamps and text
3. Update the chapter creation process to use these timestamps
4. Fall back to the estimation method if no subtitles are available

## Implementation Details

### New Methods to Add
- `extract_timestamps_from_subtitles(video_data)`: Extract subtitle data from video file
- `vtt_time_to_seconds(time_str)`: Convert VTT timestamp format to seconds
- `assign_timestamps_to_chapters(chapters, subtitle_entries, video_duration)`: Assign chapter boundaries based on subtitle segments

### Dependencies
- ffmpeg: Required for subtitle extraction
- tempfile: For creating temporary files during processing

### Changes to Existing Methods
- Update `process_video_to_chapters()` to use the new subtitle-based timestamp extraction
- Modify `create_chapters_from_structure()` to include the new timestamp data

### Testing Plan
1. Test with videos that have embedded subtitles
2. Test with videos that have external subtitle files
3. Test with videos that have no subtitles (should fall back to estimation)
4. Verify segment durations meet the 3-10 minute requirement

## Acceptance Criteria
- [ ] Timestamps from subtitles are correctly extracted when available
- [ ] Chapters are segmented into reasonable 3-10 minute chunks
- [ ] The system gracefully falls back to estimation when subtitles aren't available
- [ ] All timestamps are accurately represented in the database 