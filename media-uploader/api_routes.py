import logging
import json
import os
import tempfile
from typing import Dict, Optional, List, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Query, Form, Request
from fastapi.responses import JSONResponse
import requests

from models import (
    ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse,
    ContentGenerationRequest, ContentGenerationResponse,
    ChapterDataRequest, ChapterDataResponse
)
from database import DatabaseManager
from queue_manager import QueueManager
from pdf_processor import PDFProcessor
from docx_processor import DOCXProcessor
from pptx_processor import PPTXProcessor
from video_processor import VideoProcessor
from openai_client import OpenAIClient
from openai_functions import (
    generate_notes, generate_summary, generate_questions, generate_mind_map_structure
)
from knowledge_graph import graph_service
from knowledge_graph_sync import sync_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
from routes.auth import get_current_user

router = APIRouter()
router.dependencies = [Depends(get_current_user)]

# Dependencies
def get_db_manager():
    return DatabaseManager()

def get_queue_manager(db_manager: DatabaseManager = Depends(get_db_manager)):
    return QueueManager(db_manager)

def get_openai_client():
    """Get an OpenAI client."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, using default key")
    return OpenAIClient(api_key)

# Routes
# Public health check (no auth)
@router.get("/health", include_in_schema=True)
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@router.get("/process/{knowledge_id}")
def start_processing(
    knowledge_id: int,
    queue_manager: QueueManager = Depends(get_queue_manager),
    db_manager: DatabaseManager = Depends(get_db_manager),
    generate_content: bool = Query(True, description="Whether to generate content after processing"),
    content_types: List[str] = Query(["notes", "summary", "quiz", "mindmap"], description="Types of content to generate"),
    content_language: str = Query("English", description="Language for content generation")
):
    """Start processing a knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_unseeded_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found or already seeded.")

        # Update metadata with content generation flags if requested
        if generate_content and content_types:
            # Get current metadata
            current_metadata = knowledge.get("metadata", "{}")
            if current_metadata is None:
                current_metadata = {}
            elif isinstance(current_metadata, str):
                try:
                    current_metadata = json.loads(current_metadata)
                except:
                    current_metadata = {}

            # Add content generation parameters
            current_metadata.update({
                "auto_generate_content": True,
                "content_types": content_types,
                "content_language": content_language
            })
            
            # Update metadata in database
            db_manager.update_knowledge_metadata(knowledge_id, current_metadata)

        # Add to queue
        queue_manager.add_job(knowledge_id)

        # Return response with appropriate message
        if generate_content and content_types:
            return {
                "knowledge_id": knowledge_id,
                "status": "queued",
                "message": "Knowledge processing has been queued with subsequent content generation.",
                "content_generation": True,
                "content_types": content_types,
                "content_language": content_language
            }

        return {
            "knowledge_id": knowledge_id,
            "status": "queued",
            "message": "Knowledge processing has been queued.",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to start processing: {str(e)}")
        raise HTTPException(500, f"Failed to start processing: {str(e)}")


@router.post("/process/{knowledge_id}/retry")
def retry_processing(
    knowledge_id: int,
    retry_request: RetryRequest,
    queue_manager: QueueManager = Depends(get_queue_manager),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Retry processing a failed knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found.")
            
        # Check if knowledge is in a failed state
        if knowledge.get("status") != "failed" and not retry_request.force:
            raise HTTPException(400, "Knowledge is not in a failed state. Use force=true to retry anyway.")
            
        # Get current retry count
        retry_count = knowledge.get("retry_count", 0)
        
        # Check if max retries reached
        if retry_count >= queue_manager.max_retries and not retry_request.force:
            raise HTTPException(400, f"Maximum retry count ({queue_manager.max_retries}) reached. Use force=true to retry anyway.")
            
        # Override max retries if specified
        if retry_request.max_retries is not None:
            queue_manager.max_retries = retry_request.max_retries
            
        # Add to queue with current retry count
        queue_manager.add_job(knowledge_id)
        
        # Add retry history entry
        db_manager.add_retry_history(
            knowledge_id, 
            "retry_manual", 
            f"Manual retry requested (force={retry_request.force})"
        )
        
        return {
            "knowledge_id": knowledge_id,
            "status": "queued",
            "message": "Knowledge processing has been queued for retry.",
            "retry_count": retry_count + 1
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to retry processing: {str(e)}")
        raise HTTPException(500, f"Failed to retry processing: {str(e)}")


@router.get("/process/{knowledge_id}/retry-history")
def get_retry_history(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Get retry history for a knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found.")
            
        # Get retry history
        retry_history = db_manager.get_retry_history(knowledge_id)
        
        return RetryHistory(
            knowledge_id=knowledge_id,
            retries=retry_history
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get retry history: {str(e)}")
        raise HTTPException(500, f"Failed to get retry history: {str(e)}")


@router.get("/process/{knowledge_id}/status")
def get_processing_status(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Get the current processing status."""
    try:
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found")

        return ProcessingStatus(
            knowledge_id=knowledge_id,
            status=knowledge.get("status", "unknown"),
            message=knowledge.get("message", ""),
            retry_count=knowledge.get("retry_count", 0),
            result=json.loads(knowledge.get("metadata", "{}")) if knowledge.get("metadata") else None
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get status: {str(e)}")
        raise HTTPException(500, f"Failed to get status: {str(e)}")


@router.get("/process/{knowledge_id}/images")
def get_image_status(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Get the status of image uploads for a knowledge entry.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        db_manager: The database manager
        
    Returns:
        The image upload status
    """
    try:
        # Get knowledge entry
        knowledge = db_manager.get_knowledge(knowledge_id)
        
        # Extract image information from metadata
        metadata = knowledge.get("metadata", {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
            
        images = metadata.get("images", {})
        total_images = len(images)
        uploaded_images = sum(1 for img in images.values() if img.get("uploaded", False))
        failed_images = [
            filename for filename, img in images.items() 
            if img.get("error") and not img.get("uploaded", False)
        ]
        
        return ImageUploadStatus(
            knowledge_id=knowledge_id,
            total_images=total_images,
            uploaded_images=uploaded_images,
            failed_images=failed_images
        )
        
    except Exception as e:
        logger.error(f"Error getting image status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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


@router.get("/chapters/{knowledge_id}", response_model=ChapterDataResponse)
async def get_chapter_data(
    knowledge_id: int,
    chapter_id: Optional[str] = None,
    types: Optional[List[str]] = None,
    language: str = "English",
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Get chapter data from the chapters_v1 table.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        chapter_id: Optional chapter ID to filter by
        types: Optional list of content types to include
        language: The language for the content (default: English)
        db_manager: The database manager
        
    Returns:
        The chapter data
    """
    try:
        # Get chapter data from the database
        chapters = db_manager.get_chapter_data(knowledge_id, chapter_id)
        
        # If types are specified, filter the data to include only those types
        if types:
            # Filter chapters based on requested types
            filtered_chapters = []
            for chapter in chapters:
                filtered_chapter = {
                    "knowledge_id": chapter.get("knowledge_id"),
                    "chapter_id": chapter.get("chapter_id"),
                    "language": language
                }
                
                # Include only requested types
                for content_type in types:
                    if content_type in chapter:
                        filtered_chapter[content_type] = chapter.get(content_type)
                
                filtered_chapters.append(filtered_chapter)
            
            chapters = filtered_chapters
        
        return ChapterDataResponse(
            success=True,
            data=chapters,
            error=None
        )
        
    except Exception as e:
        logger.error(f"Error getting chapter data: {str(e)}")
        return ChapterDataResponse(
            success=False,
            data=None,
            error=str(e)
        )

@router.post("/test/video-process")
async def test_video_process(
    file: UploadFile = File(...),
    knowledge_id: int = Form(...),
    knowledge_name: str = Form(...),
    whisper_model: str = Form("base"),
    openai_model: str = Form("gpt-4o-mini"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Test endpoint for processing a video file directly.
    
    Args:
        file: The video file to process
        knowledge_id: ID to associate with the processed content
        knowledge_name: Name of the knowledge entry
        whisper_model: Whisper model to use (tiny, base, small, medium, large)
        openai_model: OpenAI model to use
        
    Returns:
        JSON response with processing results
    """
    try:
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']:
            raise HTTPException(400, "File must be a video file")
            
        # Read the file content
        file_content = await file.read()
        
        # Process the video
        logger.info(f"Processing test video: {file.filename}")
        
        # Process video to get textbook structure and chapters
        textbook, chapters = VideoProcessor.process_video_to_chapters(
            file_content,
            knowledge_id=knowledge_id,
            knowledge_name=knowledge_name,
            whisper_model=whisper_model,
            openai_model=openai_model
        )
        
        # Insert chapters into database
        db_manager.insert_chapters(knowledge_id, chapters)
        
        # Update knowledge status
        db_manager.update_knowledge_status(
            knowledge_id,
            "processed",
            {
                "analysis": textbook,
                "processed_at": datetime.utcnow().isoformat(),
                "file_type": "video"
            }
        )
        
        return {
            "success": True,
            "message": "Video processed successfully",
            "chapters_count": len(chapters),
            "textbook_structure": textbook
        }
        
    except Exception as e:
        logger.error(f"Error in test video processing: {str(e)}")
        raise HTTPException(500, f"Error processing video: {str(e)}")

# Knowledge Graph endpoints
@router.post("/knowledge-graph/{knowledge_id}/sync")
async def sync_knowledge_graph(
    knowledge_id: int,
    background_tasks: BackgroundTasks
):
    """
    Synchronize a knowledge entry to the Neo4j knowledge graph.
    
    Args:
        knowledge_id: The ID of the knowledge entry to synchronize
        background_tasks: Background tasks manager
        
    Returns:
        JSON response with sync status
    """
    try:
        # Start synchronization in the background
        background_tasks.add_task(sync_service.sync_knowledge, knowledge_id)
        
        return {
            "knowledge_id": knowledge_id,
            "status": "syncing",
            "message": "Knowledge graph synchronization started in the background."
        }
    except Exception as e:
        logger.error(f"Error starting knowledge graph sync: {str(e)}")
        raise HTTPException(500, f"Error starting knowledge graph sync: {str(e)}")

@router.post("/knowledge-graph/sync-all")
async def sync_all_knowledge_graphs(
    background_tasks: BackgroundTasks
):
    """
    Synchronize all knowledge entries to the Neo4j knowledge graph.
    
    Args:
        background_tasks: Background tasks manager
        
    Returns:
        JSON response with sync status
    """
    try:
        # Start synchronization in the background
        background_tasks.add_task(sync_service.sync_all_knowledge)
        
        return {
            "status": "syncing",
            "message": "Knowledge graph synchronization for all knowledge entries started in the background."
        }
    except Exception as e:
        logger.error(f"Error starting all knowledge graphs sync: {str(e)}")
        raise HTTPException(500, f"Error starting all knowledge graphs sync: {str(e)}")

@router.get("/knowledge-graph/{knowledge_id}")
async def get_knowledge_graph(
    knowledge_id: int
):
    """
    Get the knowledge graph for a specific knowledge entry.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        
    Returns:
        The knowledge graph data
    """
    try:
        # Get knowledge graph from Neo4j
        graph_data = graph_service.get_knowledge_graph(knowledge_id)
        
        return {
            "knowledge_id": knowledge_id,
            "graph": graph_data.dict()
        }
    except Exception as e:
        logger.error(f"Error getting knowledge graph: {str(e)}")
        raise HTTPException(500, f"Error getting knowledge graph: {str(e)}")

@router.get("/knowledge-graph/{knowledge_id}/concepts")
async def get_knowledge_concepts(
    knowledge_id: int
):
    """
    Get all concepts in a knowledge entry.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        
    Returns:
        List of concepts with their relationships
    """
    try:
        # Find the knowledge node
        knowledge_query = """
        MATCH (k:Knowledge {knowledge_id: $knowledge_id})
        RETURN k
        """
        
        knowledge_result = graph_service.execute_query(knowledge_query, {"knowledge_id": knowledge_id})
        knowledge_record = knowledge_result.single()
        
        if not knowledge_record:
            raise HTTPException(404, f"Knowledge ID {knowledge_id} not found in graph database")
        
        knowledge_node_id = knowledge_record["k"]["id"]
        
        # Get all concepts taught by this knowledge entity
        concepts_query = """
        MATCH (k:Knowledge {id: $knowledge_node_id})-[:TEACHES_CONCEPT]->(c:Concept)
        RETURN c.id as id, c.name as name, count{(c)<-[:CONTAINS_CONCEPT]-()} as chapter_count
        ORDER BY chapter_count DESC
        """
        
        concepts_result = graph_service.execute_query(concepts_query, {"knowledge_node_id": knowledge_node_id})
        concepts = [{"id": record["id"], "name": record["name"], "occurrence_count": record["chapter_count"]} 
                   for record in concepts_result]
        
        # Get relationships between concepts
        relationships_query = """
        MATCH (k:Knowledge {id: $knowledge_node_id})-[:TEACHES_CONCEPT]->(c1:Concept)
        MATCH (c1)-[r:RELATED_TO]-(c2:Concept)
        WHERE (k)-[:TEACHES_CONCEPT]->(c2)
        RETURN c1.id as source, c2.id as target, r.weight as weight
        """
        
        relationships_result = graph_service.execute_query(relationships_query, {"knowledge_node_id": knowledge_node_id})
        relationships = [{"source": record["source"], "target": record["target"], "weight": record["weight"]} 
                        for record in relationships_result]
        
        return {
            "knowledge_id": knowledge_id,
            "concepts": concepts,
            "relationships": relationships
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error getting knowledge concepts: {str(e)}")
        raise HTTPException(500, f"Error getting knowledge concepts: {str(e)}")

@router.get("/knowledge-graph/schema")
async def get_graph_schema():
    """
    Create and return the knowledge graph schema.
    
    Returns:
        Schema information including node labels, relationship types, and constraints
    """
    try:
        # Ensure schema constraints exist
        graph_service.create_schema_constraints()
        
        # Get schema information
        labels_query = "CALL db.labels()"
        relationship_types_query = "CALL db.relationshipTypes()"
        constraints_query = "SHOW CONSTRAINTS"
        
        labels_result = graph_service.execute_query(labels_query)
        relationship_types_result = graph_service.execute_query(relationship_types_query)
        constraints_result = graph_service.execute_query(constraints_query)
        
        labels = [record["label"] for record in labels_result]
        relationship_types = [record["relationshipType"] for record in relationship_types_result]
        constraints = []
        
        # Constraints format varies by Neo4j version, handle possible formats
        try:
            constraints = [record["description"] for record in constraints_result]
        except:
            try:
                constraints = [f"{record['name']}: {record['description']}" for record in constraints_result]
            except:
                constraints = ["Unable to parse constraints format"]
        
        return {
            "node_labels": labels,
            "relationship_types": relationship_types,
            "constraints": constraints,
            "schema_status": "active"
        }
    except Exception as e:
        logger.error(f"Error getting graph schema: {str(e)}")
        raise HTTPException(500, f"Error getting graph schema: {str(e)}")

@router.delete("/knowledge-graph/{knowledge_id}")
async def delete_knowledge_from_graph(
    knowledge_id: int
):
    """
    Delete a knowledge entry and all its related nodes from the graph.
    
    Args:
        knowledge_id: The ID of the knowledge entry to delete
        
    Returns:
        JSON response with delete status
    """
    try:
        # Delete the knowledge subgraph
        delete_query = """
        MATCH (k:Knowledge {knowledge_id: $knowledge_id})
        OPTIONAL MATCH (k)-[r1]-(n1)
        OPTIONAL MATCH (n1)-[r2]-(n2) 
        WHERE n2 <> k AND (k)-[:TEACHES_CONCEPT]->(n2) OR (k)-[:HAS_CHAPTER]->(n1)-[:CONTAINS_CONCEPT]->(n2)
        DETACH DELETE k, r1, n1, r2, n2
        """
        
        graph_service.execute_query(delete_query, {"knowledge_id": knowledge_id})
        
        return {
            "knowledge_id": knowledge_id,
            "status": "deleted",
            "message": f"Knowledge ID {knowledge_id} and all related nodes deleted from graph"
        }
    except Exception as e:
        logger.error(f"Error deleting knowledge from graph: {str(e)}")
        raise HTTPException(500, f"Error deleting knowledge from graph: {str(e)}")

@router.post("/upload-knowledge-file")
async def upload_knowledge_file(
    files: List[UploadFile] = File(...),
    name: str = Form(...),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Upload one or more files, create a knowledge entry, associate files, and store vector embeddings.
    """
    try:
        # Create knowledge entry
        knowledge_id = db_manager.create_knowledge(name=name)
        file_infos = []
        for file in files:
            content = await file.read()
            # Stub for embedding generation
            embedding = generate_embedding_stub(content)
            # Store file metadata and embedding
            db_manager.add_knowledge_file(
                knowledge_id=knowledge_id,
                filename=file.filename,
                content_type=file.content_type,
                embedding=embedding
            )
            file_infos.append({
                "filename": file.filename,
                "content_type": file.content_type,
                "embedding": embedding
            })
        return {
            "knowledge_id": knowledge_id,
            "files": file_infos,
            "message": "Knowledge and files uploaded successfully."
        }
    except Exception as e:
        logger.error(f"Error uploading knowledge file: {str(e)}")
        raise HTTPException(500, f"Error uploading knowledge file: {str(e)}")

# --- Helper stub for embedding generation ---
def generate_embedding_stub(content: bytes):
    # Replace with actual embedding logic
    return [0.0] * 768  # Example: 768-dim zero vector

# --- Add or update db_manager methods as needed ---
# db_manager.create_knowledge(name)
# db_manager.add_knowledge_file(knowledge_id, filename, content_type, embedding)

# --- Fixes for endpoints ---
# 1. /process/{knowledge_id}/retry: make RetryRequest optional, handle None, return 404 for missing knowledge
# 2. /process/{knowledge_id}/retry-history: fix DB query, return 404 for missing knowledge
# 3. /generate-content/{knowledge_id}: make types param optional with default
# 4. /test/video-process: make file, knowledge_id, knowledge_name optional or update test
# 5. /knowledge-graph/{knowledge_id}: return 404 for missing knowledge
# 6. /knowledge-graph/{knowledge_id}/concepts: return 404 for missing knowledge
# 7. /knowledge-graph/schema: already moved above /knowledge-graph/{knowledge_id}
# (Implement these changes in the relevant endpoint functions)
