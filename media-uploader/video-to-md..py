import os
import argparse
import time
import torch
import json
import logging
from tqdm import tqdm
from video_processor_v2 import VideoProcessorV2

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Convert video to structured course content")
    parser.add_argument("--video_path", type=str, required=True, help="Path to the video file")
    parser.add_argument("--output_dir", type=str, default="./output", help="Directory to save output files")
    parser.add_argument("--knowledge_id", type=int, default=42, help="Knowledge ID for the content")
    parser.add_argument("--knowledge_name", type=str, default="Video Course", help="Name of the course")
    parser.add_argument("--whisper_model", type=str, default="base", 
                       help="Whisper model size (tiny, base, small, medium, large)")
    parser.add_argument("--openai_api_key", type=str, default="", help="OpenAI API key")
    parser.add_argument("--openai_model", type=str, default="gpt-4o-mini", help="OpenAI model to use")
    parser.add_argument("--batch_size", type=int, default=3, help="Batch size for processing chunks")
    parser.add_argument("--max_workers", type=int, default=4, help="Maximum number of worker threads")
    return parser.parse_args()

def main():
    """Main function to run the enhanced pipeline."""
    args = parse_arguments()
    
    start_time = time.time()
    logger.info(f"Starting enhanced video processing pipeline")
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Check if CUDA is available for Whisper
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    # Process the video using our enhanced processor
    try:
        # Read video data
        with open(args.video_path, 'rb') as f:
            video_data = f.read()
        
        # Process video to get course structure and chapters
        logger.info(f"Processing video: {args.video_path}")
        course_structure, chapters = VideoProcessorV2.process_video_to_chapters(
            video_data=video_data,
            knowledge_id=args.knowledge_id,
            knowledge_name=args.knowledge_name,
            whisper_model=args.whisper_model,
            openai_model=args.openai_model,
            openai_api_key=args.openai_api_key,
            batch_size=args.batch_size,
            max_workers=args.max_workers
        )
        
        # Save course structure as JSON
        structure_path = os.path.join(args.output_dir, "course_structure.json")
        with open(structure_path, "w", encoding="utf-8") as f:
            json.dump(course_structure, f, indent=4)
        logger.info(f"Course structure saved to: {structure_path}")
        
        # Save chapters as JSON
        chapters_path = os.path.join(args.output_dir, "chapters.json")
        with open(chapters_path, "w", encoding="utf-8") as f:
            json.dump(chapters, f, indent=4)
        logger.info(f"Chapters saved to: {chapters_path}")
        
        # Generate and save a Markdown version for reference
        markdown_content = VideoProcessorV2.convert_structure_to_markdown(course_structure)
        markdown_path = os.path.join(args.output_dir, "structured_course.md")
        with open(markdown_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        logger.info(f"Markdown content saved to: {markdown_path}")
        
        # Save raw transcription if available in the course structure
        if "transcription" in course_structure.get("metadata", {}):
            transcription_path = os.path.join(args.output_dir, "transcription.txt")
            with open(transcription_path, "w", encoding="utf-8") as f:
                f.write(course_structure["metadata"]["transcription"])
            logger.info(f"Transcription saved to: {transcription_path}")
    
    except Exception as e:
        logger.error(f"Error in processing: {str(e)}", exc_info=True)
    
    total_time = time.time() - start_time
    logger.info(f"Pipeline completed in {total_time:.2f} seconds")

if __name__ == "__main__":
    main()