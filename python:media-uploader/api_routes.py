from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .database_manager import DatabaseManager, get_db_manager
from .openai_client import OpenAIClient, get_openai_client
from .content_generators import generate_notes, generate_summary, generate_questions, generate_mind_map_structure
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ContentGenerationResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None

@router.get("/generate-content/{knowledge_id}", response_model=ContentGenerationResponse)
async def generate_content(
    knowledge_id: int,
    chapter_id: Optional[str] = None,
    types: List[str] = Query(...),
    language: str = "English",
    db_manager: DatabaseManager = Depends(get_db_manager),
    openai_client: OpenAIClient = Depends(get_openai_client)
):
    """
    Generate content using OpenAI.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        chapter_id: Optional ID of the specific chapter to process
        types: List of content types to generate
        language: The language for the content (default: English)
        db_manager: The database manager
        openai_client: The OpenAI client
        
    Returns:
        The generated content
    """
    logger.info(f"Starting content generation for knowledge_id={knowledge_id}, chapter_id={chapter_id}, types={types}, language={language}")
    try:
        # Get chapter data from the database
        chapters = db_manager.get_chapter_data(knowledge_id, chapter_id)
        
        if not chapters or len(chapters) == 0:
            error_msg = f"No chapters found for knowledge_id={knowledge_id}" + (f", chapter_id={chapter_id}" if chapter_id else "")
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info(f"Found {len(chapters)} chapters to process")
        
        # Define type generators mapping
        type_generators = {
            "notes": generate_notes,
            "summary": generate_summary,
            "quiz": generate_questions,
            "mindmap": generate_mind_map_structure,
        }
        
        # Validate requested content types
        invalid_types = [t for t in types if t not in type_generators]
        if invalid_types:
            logger.warning(f"Ignoring unsupported content types: {invalid_types}")
            types = [t for t in types if t in type_generators]
            
        if not types:
            error_msg = "No valid content types specified"
            logger.error(error_msg)
            return ContentGenerationResponse(
                success=False,
                error=error_msg
            )
        
        all_results = []
        processed_chapters = 0
        failed_chapters = 0
        # Process each chapter (all chapters, not just the first one)
        for chapter in chapters:
            chapter_id = chapter.get("id")
            logger.info(f"Processing chapter {chapter_id} ({processed_chapters + 1}/{len(chapters)})")
            
            # Generate content for each requested type
            results = {}
            chapter_success = True
            
            for content_type in types:
                generator = type_generators[content_type]
                
                try:
                    logger.info(f"Generating {content_type} for chapter {chapter_id}")
                    # Call the appropriate generator function
                    if content_type == "mindmap":
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                    elif content_type == "quiz":
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                    else:
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                        # Join the chunked results with a delimiter for storage
                        generated = "|||||".join(generated) if isinstance(generated, list) else generated
                    
                    results[content_type] = generated
                    logger.info(f"Successfully generated {content_type} content for chapter {chapter_id}")
                except Exception as e:
                    logger.error(f"Error generating {content_type} for chapter {chapter_id}: {str(e)}")
                    error_message = f"Error generating {content_type}: {str(e)}"
                    results[content_type] = error_message
                    results[f"{content_type}_error"] = str(e)
                    chapter_success = False
            
            # Add generation metadata 
            results["generation_status"] = "complete" if chapter_success else "partial"
            results["generated_at"] = datetime.utcnow().isoformat()
            results["generated_types"] = [t for t in types if t in results and not t.endswith("_error")]
            
            # Update content in the database using the table with language suffix
            table_name = f"EdTechContent_{language}"
            logger.info(f"Updating content in {table_name} for chapter {chapter_id}, knowledge_id {knowledge_id}")
            
            try:
                data = db_manager.supabase.from_(table_name).update(
                    results
                ).eq('chapter_id', chapter_id).eq('knowledge_id', knowledge_id).execute()
                
                # Fetch the updated record separately if needed
                updated_record = db_manager.supabase.from_(table_name).select("*").eq('chapter_id', chapter_id).eq('knowledge_id', knowledge_id).execute()
                
                if hasattr(data, 'error') and data.error:
                    logger.error(f"Error updating content for chapter {chapter_id}: {data.error}")
                    failed_chapters += 1
                    continue
                
                logger.info(f"Successfully updated content in {table_name} for chapter {chapter_id}")
                all_results.extend(updated_record.data if hasattr(updated_record, 'data') and updated_record.data else [])
                processed_chapters += 1
            except Exception as e:
                logger.error(f"Database error updating content for chapter {chapter_id}: {str(e)}")
                failed_chapters += 1
        
        # Return appropriate response based on success/failure counts
        if processed_chapters == 0:
            return ContentGenerationResponse(
                success=False,
                error=f"Failed to generate content for all {len(chapters)} chapters",
                data={"failed_chapters": failed_chapters, "processed_chapters": processed_chapters}
            )
        elif failed_chapters > 0:
            return ContentGenerationResponse(
                success=True,
                data={"chapters": all_results, "failed_chapters": failed_chapters, "processed_chapters": processed_chapters},
                message=f"Partially successful: {processed_chapters} chapters processed, {failed_chapters} chapters failed"
            )
        else:
            return ContentGenerationResponse(
                success=True,
                data={"chapters": all_results}
            )
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        return ContentGenerationResponse(
            success=False,
            error=str(e)
        )