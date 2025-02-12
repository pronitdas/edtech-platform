import os
import sys
import time
import base64
import argparse
import json
from marker.convert import convert_single_pdf
from marker.logger import configure_logging
from marker.models import load_all_models  # Import function to load models
import logging

# Initialize logging
configure_logging()
logger = logging.getLogger(__name__)

# Function to parse PDF and return markdown, metadata, and image data
def parse_pdf_and_return_markdown(pdf_file: bytes, extract_images: bool, model_list, output_folder: str):
    """
    Function to parse a PDF and extract text and images.

    Args:
    pdf_file (bytes): The content of the PDF file.
    extract_images (bool): Whether to extract images or not.
    output_folder (str): Path to save the extracted assets.

    Returns:
    tuple: A tuple containing the full text, metadata, and image data (if extracted).
    """
    logger.debug("Parsing PDF file")
    full_text, images, out_meta = convert_single_pdf(pdf_file, model_list)
    logger.debug(f"Images extracted: {list(images.keys())}")
    image_data = {}

    # Save images if extraction is enabled
    if extract_images:
        image_folder = os.path.join(output_folder, "images")
        os.makedirs(image_folder, exist_ok=True)

        for i, (filename, image) in enumerate(images.items()):
            image_filename = os.path.join(image_folder, filename)
            logger.debug(f"Saving image {filename} to {image_filename}")
            image.save(image_filename, "PNG")
            image_data[filename] = image_filename

    return full_text, out_meta, image_data


# Function to process a single PDF file
def process_pdf_file(file_content: bytes, filename: str, model_list, output_folder: str):
    """
    Function to process a single PDF file.

    Args:
    file_content (bytes): The content of the PDF file.
    filename (str): The name of the PDF file.
    model_list: The list of loaded models.
    output_folder (str): Path to save the extracted assets.

    Returns:
    dict: A dictionary containing the filename, markdown text, metadata, image data, status, and processing time.
    """
    entry_time = time.time()
    logger.info(f"Entry time for {filename}: {entry_time}")
    markdown_text, metadata, image_data = parse_pdf_and_return_markdown(
        file_content, extract_images=True, model_list=model_list, output_folder=output_folder
    )
    completion_time = time.time()
    logger.info(f"Model processes complete time for {filename}: {completion_time}")
    time_difference = completion_time - entry_time

    # Save markdown and metadata to files
    markdown_file = os.path.join(output_folder, f"{filename}_content.md")
    metadata_file = os.path.join(output_folder, f"{filename}_metadata.json")

    logger.debug(f"Saving markdown to {markdown_file}")
    with open(markdown_file, "w", encoding="utf-8") as md_file:
        md_file.write(markdown_text)

    logger.debug(f"Saving metadata to {metadata_file}")
    with open(metadata_file, "w", encoding="utf-8") as json_file:
        json.dump(metadata, json_file, indent=4)

    return {
        "filename": filename,
        "markdown_file": markdown_file,
        "metadata_file": metadata_file,
        "images": image_data,
        "status": "ok",
        "time": time_difference,
    }


# CLI Main Function
def main():
    parser = argparse.ArgumentParser(description="Parse PDF files into markdown, metadata, and images.")
    parser.add_argument("filepath", type=str, help="Path to the PDF file to process")
    parser.add_argument(
        "-o", "--output", type=str, default="output", help="Directory to save extracted assets (default: ./output)"
    )
    args = parser.parse_args()

    file_path = args.filepath
    output_folder = args.output

    if not os.path.isfile(file_path):
        logger.error(f"The file '{file_path}' does not exist or is not a file.")
        sys.exit(1)

    # Create output folder
    os.makedirs(output_folder, exist_ok=True)

    # Load the PDF content
    try:
        with open(file_path, "rb") as pdf_file:
            file_content = pdf_file.read()
    except Exception as e:
        logger.error(f"Failed to read the file '{file_path}': {e}")
        sys.exit(1)

    # Placeholder for models
    model_list = load_all_models()


    # Process the file
    filename = os.path.splitext(os.path.basename(file_path))[0]
    result = process_pdf_file(file_content, filename, model_list, output_folder)

    # Print the result
    print("Processing complete:")
    print(f"Markdown saved at: {result['markdown_file']}")
    print(f"Metadata saved at: {result['metadata_file']}")
    print(f"Images saved in: {os.path.join(output_folder, 'images')}")
    print(f"Processing Time (seconds): {result['time']}")


if __name__ == "__main__":
    main()
