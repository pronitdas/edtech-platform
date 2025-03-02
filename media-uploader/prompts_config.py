"""
Configuration for OpenAI prompts used in content generation.
"""

class PromptsConfig:
    """Configuration for OpenAI prompts."""
    
    @staticmethod
    def notes(language: str) -> str:
        """
        Get the prompt for generating notes.
        
        Args:
            language: The language to generate notes in
            
        Returns:
            The prompt string
        """
        return f"""
You are a content expert skilled at distilling information to its core points in {language}.
Expanding upon the following content into detailed, informative notes with easily digestible explanations that highlight the main ideas, key takeaways, and any relevant context.
Generate content in Markdown format with proper usage of LaTeX syntax for mathematical expressions. Use $...$ for inline LaTeX and $$...$$ for block LaTeX. 
Ensure the text is well-structured, concise, and includes a mix of Markdown headings, lists, and explanatory text along with mathematical formulas.
Focus on providing clear examples and explanations, combining text and mathematical formulas seamlessly. Keep the content engaging and visually intuitive.
in {language}
Content:"""
    
    @staticmethod
    def summary(language: str) -> str:
        """
        Get the prompt for generating summaries.
        
        Args:
            language: The language to generate summaries in
            
        Returns:
            The prompt string
        """
        return f"""
You are a content expert skilled at distilling information to its core points in {language}. 
Summarize the following content into concise, easily digestible points that highlight the main ideas, key takeaways, and any relevant context.
Structure the summary in {language} with headers for each major topic, followed by brief, insightful bullet points or short paragraphs.
Format the output in Markdown and include any contextual insights that add depth to the summary in {language}.

Content:"""
    
    @staticmethod
    def mind_map() -> str:
        """
        Get the prompt for generating mind maps.
        
        Returns:
            The prompt string
        """
        return """You are a mind map generator specialized in creating educational content structures.

Task: Generate a comprehensive mind map structure as a JSON object with nodes and edges arrays.

Requirements:
1. Main topic should be type "input" with id "1"
2. Leaf nodes should be type "output"
3. Intermediate nodes should be type "default"
4. Create at least 4 levels of hierarchy
5. Ensure connections are logical and flow from general to specific
6. Include key concepts, relationships, and important details
7. Make the structure easily understandable for students
8. Generate only valid JSON with no markdown formatting

The response must strictly follow this JSON structure:
{
  "nodes": [
    { "id": "string", "type": "input|default|output", "data": { "label": "string" } }
  ],
  "edges": [
    { "id": "string", "source": "string", "target": "string" }
  ]
}"""
    
    @staticmethod
    def structured_questions(count: int, language: str) -> str:
        """
        Get the prompt for generating structured questions.
        
        Args:
            count: Number of questions to generate
            language: The language to generate questions in
            
        Returns:
            The prompt string
        """
        return f"""
Generate {count} multiple-choice questions based on the following content in {language} in this format:
[{{"question":"something", "options": [], "answer":"answer"}}]:"""

prompts_config = PromptsConfig() 