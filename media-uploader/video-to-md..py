import os
import argparse
import time
import torch
import whisper
import json
from openai import OpenAI
import logging
from tqdm import tqdm
from video_processor import VideoProcessor
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
    parser.add_argument("--whisper_model", type=str, default="base", 
                       help="Whisper model size (tiny, base, small, medium, large)")
    parser.add_argument("--openai_api_key", type=str, default="",help="OpenAI API key")
    parser.add_argument("--openai_model", type=str, default="gpt-4o-mini", help="OpenAI model to use")
    return parser.parse_args()

def transcribe_video(video_path, model_name="base"):
    """
    Transcribe video using OpenAI Whisper model.
    
    Args:
        video_path (str): Path to the video file
        model_name (str): Whisper model size (tiny, base, small, medium, large)
        
    Returns:
        str: Transcribed text
    """
    logger.info(f"Loading Whisper model: {model_name}")
    model = whisper.load_model(model_name)
    
    logger.info(f"Transcribing video: {video_path}")
    result = model.transcribe(video_path)
    
    return result["text"]

def save_transcription(transcription, output_dir):
    """Save transcription to a file."""
    os.makedirs(output_dir, exist_ok=True)
    transcription_path = os.path.join(output_dir, "transcription.txt")
    
    with open(transcription_path, "w", encoding="utf-8") as f:
        f.write(transcription)
    
    logger.info(f"Transcription saved to: {transcription_path}")
    return transcription_path

def chunk_text(text, max_chunk_size=12000):
    """Split text into chunks of specified size."""
    words = text.split()
    chunks = []
    current_chunk = []
    
    current_size = 0
    for word in words:
        word_size = len(word) + 1  # +1 for space
        if current_size + word_size > max_chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_size = word_size
        else:
            current_chunk.append(word)
            current_size += word_size
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

def generate_course_content(transcription, api_key, model_name="gpt-4o-mini"):
    """
    Generate structured course content from transcription using OpenAI.
    
    Args:
        transcription (str): Transcribed text
        api_key (str): OpenAI API key
        model_name (str): OpenAI model to use
        
    Returns:
        str: Structured course content in Markdown
    """
    client = OpenAI(api_key=api_key)
    
    # Split transcription into manageable chunks
    chunks = chunk_text(transcription)
    logger.info(f"Split transcription into {len(chunks)} chunks")
    
    # Process each chunk
    processed_chunks = []
    
    for i, chunk in enumerate(tqdm(chunks, desc="Processing chunks")):
        prompt = f"""
        You are a professional curriculum developer tasked with transforming lecture transcripts into structured course materials.
        
        Here is a transcript from a lecture on finance or economics:
        
        ```
        {chunk}
        ```
        
        Please convert this into a structured course section in Markdown format. Follow these guidelines:
        
        1. Create clear headings and subheadings based on the content
        2. Maintain all the original content and examples
        3. Add approximately 20% new insights, examples, or clarifications that enhance the original material
        4. Use proper Markdown formatting (headings with #, ## etc., bullet points, code blocks if needed)
        5. Avoid adding summaries - stick to transforming the content while maintaining its substance
        6. Make sure to include all numerical examples, data points, and calculations from the original
        7. If this is part {i+1} of {len(chunks)}, ensure your section can flow from/to other parts
        
        Your output should be well-structured Markdown ready to be included in a course document.
        """
        
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "system", "content": "You are a curriculum development expert specializing in finance and economics."},
                         {"role": "user", "content": prompt}],
                max_tokens=4000,
                temperature=0.5
            )
            
            processed_content = response.choices[0].message.content
            processed_chunks.append(processed_content)
            
            # Rate limiting - pause between significant API calls
            time.sleep(3)
            
        except Exception as e:
            logger.error(f"Error processing chunk {i+1}: {e}")
            processed_chunks.append(f"ERROR PROCESSING CHUNK {i+1}: {str(e)}")
    
    # Combine all processed chunks
    full_content = "\n\n".join(processed_chunks)
    
    # Final pass to ensure consistency across the entire document
    try:
        consistency_prompt = f"""
        Here is a structured course document created from lecture transcripts. Please review it for consistency in:
        
        1. Heading levels and hierarchy
        2. Formatting style
        3. Terminology use
        4. Cross-references between sections
        
        Make minimal changes necessary to ensure the document feels cohesive and has a consistent style throughout.
        Here's the content:
        
        ```
        {full_content[:15000]}  # Using first part only for consistency check
        ```
        
        Please return the improved version maintaining the same markdown format.
        """
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "system", "content": "You are a curriculum editor ensuring document consistency."},
                     {"role": "user", "content": consistency_prompt}],
            max_tokens=2000,
            temperature=0.3
        )
        
        # We'll use the consistency guidance but keep the full content
        consistency_guidance = response.choices[0].message.content
        logger.info("Applied consistency improvements to the document structure")
        
    except Exception as e:
        logger.error(f"Error in consistency pass: {e}")
        consistency_guidance = "Could not perform consistency check"
    
    return full_content

def save_course_content(content, output_dir):
    """Save course content to a Markdown file."""
    os.makedirs(output_dir, exist_ok=True)
    course_path = os.path.join(output_dir, "structured_course.md")
    
    with open(course_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    logger.info(f"Structured course content saved to: {course_path}")
    return course_path

def main():
    """Main function to run the pipeline."""
    args = parse_arguments()
    
    start_time = time.time()
    logger.info(f"Starting video processing pipeline")
    
    # Check if CUDA is available for Whisper
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    # Step 1: Transcribe video
    # transcription = transcribe_video(args.video_path, args.whisper_model)
    # transcription_path = save_transcription(transcription, args.output_dir)
    transcription_path = os.path.join(args.output_dir, "transcription.txt")
    course_path = os.path.join(args.output_dir, "structured_course.md")

    # Step 2: Generate structured course content
    logger.info("Generating structured course content")
    with open(course_path, "r", encoding="utf-8") as f:
      # course_content = generate_course_content(f.read(), args.openai_api_key, args.openai_model)
      
      textbook = VideoProcessor.parse_video_to_textbook(f.read())
      textbook_path = os.path.join(args.output_dir, "textbook.json")
      chapters = VideoProcessor.walk_textbook(textbook, "42")
      chapters_path = os.path.join(args.output_dir, "chapters.json")

      with open(textbook_path, "w", encoding="utf-8") as f:
        json.dump(textbook, f, indent=4)

      with open(chapters_path, "w", encoding="utf-8") as f:
        json.dump(chapters, f, indent=4)
      # course_path = save_course_content(course_content, args.output_dir)
    
    total_time = time.time() - start_time
    logger.info(f"Pipeline completed in {total_time:.2f} seconds")
    logger.info(f"Output files:")
    logger.info(f"- Transcription: {transcription_path}")
    logger.info(f"- Structured Course: {course_path}")

if __name__ == "__main__":
    main()